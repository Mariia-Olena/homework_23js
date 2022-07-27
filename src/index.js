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
        console.log(noteResponse);

        if (!noteText.trim()) {
            return;
        }

        const isUnique = this.checkUnique(noteText);

        if (isUnique && noteResponse) {
            this.noteList.push(noteResponse);
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

        const noteResponse = await response.json();

        this.noteList = this.noteList.filter((note) => note._id !== +id);
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

    renderList() {
        const list = document.querySelector('.notes__list');
        list.innerHTML = '';

        const listTodo = document.createElement('ul');
        listTodo.classList.add('notes__list_todo');

        const listDone = document.createElement('ul');
        listDone.classList.add('notes__list_done');

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

            if (note.checked === true) {
                text.classList.add('done');
                doneButton.textContent = 'Undone';
                listDone.append(listItem);
            } else {
                listTodo.append(listItem);
            }
        }
        list.append(listTodo, listDone);
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

            this.renderList();
        });
    }

    initRemove() {
        this.cards.addEventListener('click', (e) => {
            if (e.target.classList.contains('notes__button_remove')) {
                const id = e.target.closest('.notes__item').getAttribute('id');
                this.model.deleteNote(id);
            }

            this.renderList();
        });

        this.renderList();
    }

    initToggle() {
        this.cards.addEventListener('click', (e) => {
            if (e.target.classList.contains('notes__button_done')) {
                const id = e.target.closest('.notes__item').getAttribute('id');
                this.model.toggleIsDone(id);
            }

            this.renderList();
        });

        this.renderList();
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

            this.model.auth(userLogin);

            this.popup.style.display = 'none';
        });
    }
}

const noteModel = new ToDoModel();
const noteView = new ToDoView(noteModel);
noteView.initSubmit();
noteView.initRemove();
noteView.initToggle();
noteView.initLogin();