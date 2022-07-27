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

        localStorage.setItem(userLogin, this.#token);

        this.getNotes();
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

        this.noteList = userNotes;

        await this.renderList();
    }

    async addNote(noteText, priority) {
        const requestBody = JSON.stringify({
            value: noteText,
            priority
        });

        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.#token}`);

        const response = await fetch(`${this.#baseUrl}/to1do`, {
            method: 'POST',
            headers,
            body: requestBody
        });

        const noteResponse = await response.json();

        const isUnique = this.checkUnique(noteText);

        if (isUnique && !noteResponse.statusCode) {
            this.noteList.push(noteResponse);
        }

        await this.renderList();
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

        const noteResponse = await response.json();

        if (!noteResponse.statusCode) {
            this.noteList = this.noteList.filter((note) => note._id !== +id);
        }

        await this.renderList();
    }

    async toggleIsDone(id) {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${this.#token}`);

        const response = await fetch(`${this.#baseUrl}/todo/${id}/toggle`, {
            method: 'PUT',
            headers,
        });

        const noteResponse = await response.json();

        if (noteResponse) {
            const index = this.noteList.findIndex(note => note._id === +id);
            // eslint-disable-next-line no-magic-numbers
            if (index !== -1) {
                this.noteList[index].checked = !this.noteList[index].checked;
            }
        }

        await this.renderList();
    }

    async renderList() {
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

        for (const note of this.noteList) {
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

            if (note.checked === true) {
                text.classList.add('done');
                doneButton.textContent = 'Undone';
                // listItem.style.display = 'none';
                switch (note.priority) {
                case 0:
                    listPriorityDone0.append(listItem);
                    break;
                case 1:
                    listPriorityDone1.append(listItem);
                    break;
                case 2:
                    listPriorityDone2.append(listItem);
                    break;
                }

                listDone.append(listPriorityDone2, listPriorityDone1, listPriorityDone0);
            } else {
                switch (note.priority) {
                case 0:
                    listPriority0.append(listItem);
                    break;
                case 1:
                    listPriority1.append(listItem);
                    break;
                case 2:
                    listPriority2.append(listItem);
                    break;
                }
                listTodo.append(listPriority2, listPriority1, listPriority0);
            }
        }
        list.append(listTodo, listDone);
    }
}

class ToDoView {
    constructor(model) {
        this.model = model;
        this.form = document.querySelector('.form');
        this.cards = document.querySelector('.notes__list');
        this.popup = document.querySelector('.popup');
        this.select = document.querySelector('.form__select');
    }

    initSubmit() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();

            const fromData = new FormData(e.target);
            const formText = fromData.get('text').trim();
            const formPriority = +this.select.value;

            if (formText) {
                this.model.addNote(formText, formPriority);
            }

            e.target.reset();
        });
    }

    initRemove() {
        this.cards.addEventListener('click', (e) => {
            if (e.target.classList.contains('notes__button_remove')) {
                const id = e.target.closest('.notes__item').getAttribute('id');
                this.model.deleteNote(id);
            }
        });
    }

    initToggle() {
        this.cards.addEventListener('click', (e) => {
            if (e.target.classList.contains('notes__button_done')) {
                const id = e.target.closest('.notes__item').getAttribute('id');
                this.model.toggleIsDone(id);
            }
        });
    }

    initLogin() {
        this.popup.addEventListener('submit', (e) => {
            e.preventDefault();

            const fromData = new FormData(e.target);
            const formEmail = fromData.get('popup-email').trim();
            const formPassword = fromData.get('popup-password').trim();

            const userLogin = formEmail.concat(formPassword);

            if (!userLogin) {
                return;
            }

            this.popup.style.display = 'none';

            this.model.auth(userLogin);
        });
    }
}

const noteModel = new ToDoModel();
const noteView = new ToDoView(noteModel);
noteView.initSubmit();
noteView.initRemove();
noteView.initToggle();
noteView.initLogin();