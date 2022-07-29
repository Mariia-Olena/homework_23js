class ToDoModel {
    noteList = [];
    #token ='';
    #baseUrl = 'https://todo.hillel.it';

    async auth(userLogin) {
        const requestBody = JSON.stringify({
            value: userLogin
        });

        const headers = new Headers();
        headers.set('Content-Type', 'application/json');

        const response = await fetch(`${this.#baseUrl}/auth/login`, {
            method: 'POST',
            headers,
            body: requestBody
        });

        const { access_token: accessToken } = await response.json();
        this.#token = accessToken;
        localStorage.setItem('userToken', this.#token);

        await this.getNotes();
    }

    getToken(token) {
        this.#token = token;
    }

    async getNotes() {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.#token}`);

        const response = await fetch(`${this.#baseUrl}/todo`, {
            method: 'GET',
            headers
        });

        const userNotes = await response.json();

        if (response.ok === true) {
            this.noteList = userNotes;
        } else {
            throw new Error();
        }
    }

    async addNote(noteText, priority) {
        const requestBody = JSON.stringify({
            value: noteText,
            priority
        });

        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.#token}`);

        const response = await fetch(`${this.#baseUrl}/todo`, {
            method: 'POST',
            headers,
            body: requestBody
        });

        const noteResponse = await response.json();
        const isUnique = this.checkUnique(noteText);

        if (isUnique && response.ok === true) {
            this.noteList.push(noteResponse);
        } else {
            throw new Error();
        }
    }

    checkUnique(noteText) {
        return !this.noteList.find(note => note.noteText === noteText);
    }

    async deleteNote(id) {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.#token}`);

        const response = await fetch(`${this.#baseUrl}/todo/${id}`, {
            method: 'DELETE',
            headers,
        });

        if (response.ok === true) {
            this.noteList = this.noteList.filter((note) => note._id !== +id);
        } else {
            throw new Error();
        }
    }

    async toggleIsDone(id) {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.#token}`);

        const response = await fetch(`${this.#baseUrl}/todo/${id}/toggle`, {
            method: 'PUT',
            headers,
        });

        if (response.ok === true) {
            const toggleNote = this.noteList.find(note => note._id === +id);
            toggleNote.checked = !toggleNote.checked;
        } else {
            throw new Error();
        }
    }
}

class ToDoView {
    form = document.querySelector('.form');
    cards = document.querySelector('.notes__list');
    popup = document.querySelector('.popup');
    select = document.querySelector('.form__select');
    buttonSubmit = document.querySelector('.form__button');
    buttonLogOut = document.querySelector('.button__log-out');
    error = document.querySelector('.error');

    constructor(model) {
        this.model = model;
    }

    renderList() {
        const list = document.querySelector('.notes__list');
        list.innerHTML = '';

        const listTodo = document.createElement('ul');
        listTodo.classList.add('notes__list_todo');

        const listDone = document.createElement('ul');
        listDone.classList.add('notes__list_done');

        const listPriority0 = document.createElement('ul');
        const listPriority1 = document.createElement('ul');
        const listPriority2 = document.createElement('ul');

        const listPriorityDone0 = document.createElement('ul');
        const listPriorityDone1 = document.createElement('ul');
        const listPriorityDone2 = document.createElement('ul');

        for (const note of this.model.noteList) {
            const listItem = document.createElement('li');
            listItem.classList.add('notes__item');
            listItem.classList.add(`priority_color_${note.priority}`);
            listItem.setAttribute('id', `${note._id}`);

            const text = document.createElement('p');
            text.classList.add('notes__text');
            text.textContent = `${note.value}`;

            const wrap = document.createElement('div');
            wrap.classList.add('notes__wrap');

            const doneButton = document.createElement('button');
            doneButton.classList.add('notes__button', 'notes__button_done');
            doneButton.textContent = 'Done';

            const removeButton = document.createElement('button');
            removeButton.classList.add('notes__button', 'notes__button_remove');
            removeButton.textContent = 'Remove';

            wrap.append(doneButton, removeButton);
            listItem.append(text, wrap);

            const priorityLevel0 = 0;
            const priorityLevel1 = 1;
            const priorityLevel2 = 2;

            if (note.checked === true) {
                text.classList.add('done');
                doneButton.textContent = 'Undone';

                switch (note.priority) {
                case priorityLevel0:
                    listPriorityDone0.append(listItem);
                    break;
                case priorityLevel1:
                    listPriorityDone1.append(listItem);
                    break;
                case priorityLevel2:
                    listPriorityDone2.append(listItem);
                    break;
                }
                listDone.append(listPriorityDone2, listPriorityDone1, listPriorityDone0);
            } else {
                switch (note.priority) {
                case priorityLevel0:
                    listPriority0.append(listItem);
                    break;
                case priorityLevel1:
                    listPriority1.append(listItem);
                    break;
                case priorityLevel2:
                    listPriority2.append(listItem);
                    break;
                }
                listTodo.append(listPriority2, listPriority1, listPriority0);
            }
        }
        list.append(listTodo, listDone);
    }

    initSubmit() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fromData = new FormData(e.target);
            const formText = fromData.get('text').trim();
            const formPriority = +this.select.value;
            if (formText) {
                await this.model.addNote(formText, formPriority).catch( () => this.showError());
                this.renderList();
            }

            e.target.reset();
        });
    }

    initRemove() {
        this.cards.addEventListener('click', async (e) => {
            if (e.target.classList.contains('notes__button_remove')) {
                const id = e.target.closest('.notes__item').getAttribute('id');
                await this.model.deleteNote(id).catch( () => this.showError());

                this.renderList();
            }
        });
    }

    initToggle() {
        this.cards.addEventListener('click', async (e) => {
            if (e.target.classList.contains('notes__button_done')) {
                const id = e.target.closest('.notes__item').getAttribute('id');
                await this.model.toggleIsDone(id).catch( () => this.showError());

                this.renderList();
            }
        });
    }

    initLogin() {
        this.popup.style.display = 'flex';
        this.popup.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fromData = new FormData(e.target);
            const formEmail = fromData.get('popup-email').trim();
            const formPassword = fromData.get('popup-password').trim();
            const userLogin = formEmail.concat(formPassword);

            if (!userLogin) {
                return;
            }

            this.popup.style.display = 'none';
            await this.model.auth(userLogin).catch( () => this.showError());
            this.renderList();
        });
    }

    async initCheckToken() {
        const token = localStorage.getItem('userToken');

        if (token) {
            this.model.getToken(token);
            await this.model.getNotes().catch( () => this.showError());
            this.renderList();
            this.popup.style.display = 'none';
            return;
        } else {
            this.initLogin();
        }
    }

    initLogOut() {
        this.buttonLogOut.addEventListener('click', () => {
            this.popup.style.display = 'flex';
            localStorage.removeItem('userToken');

            this.initLogin();
        });
    }

    showError() {
        this.error.style.display = 'block';
        const delay = 2000;

        setTimeout(() => {
            this.error.style.display = 'none';
        }, delay);
    }
}

const noteModel = new ToDoModel();
const noteView = new ToDoView(noteModel);
noteView.initSubmit();
noteView.initRemove();
noteView.initToggle();
noteView.initCheckToken();
noteView.initLogOut();