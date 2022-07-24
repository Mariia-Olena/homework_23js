const indexNotFound = -1;
const deleteOneIndex = 1;

class ToDoModel {
    noteList = [];

    constructor() {
        if (localStorage.getItem('noteList')) {
            this.noteList = JSON.parse(localStorage.getItem('noteList'));
        }
    }

    addNote(noteTitle, noteText) {
        if (!noteTitle.trim() || !noteText.trim()) {
            return;
        }

        const isUnique = this.checkUnique(noteTitle);

        if (isUnique) {
            const note = {
                title: noteTitle,
                text: noteText,
                isDone: false
            };

            this.noteList.push(note);
        }
    }

    checkUnique(noteTitle) {
        return !this.noteList.find(note => note.title === noteTitle);
    }

    deleteNote(noteTitle) {
        const deleteIndex = this.noteList.findIndex(note => note.title === noteTitle);

        if (deleteIndex !== indexNotFound) {
            this.noteList.splice(deleteIndex, deleteOneIndex);
        }
    }

    toggleIsDone(noteTitle) {
        const index = this.noteList.findIndex(note => note.title === noteTitle);

        if (index !== indexNotFound) {
            this.noteList[index].isDone = !this.noteList[index].isDone;
        }
    }
}

class ToDoView {
    constructor(model) {
        this.model = model;
        this.form = document.querySelector('.form');
        this.cards = document.querySelector('.notes__list');
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
            listItem.setAttribute('id', `${note.title}`);

            const title = document.createElement('h2');
            title.classList.add('notes__title');
            title.textContent = `${note.title}`;

            const text = document.createElement('p');
            text.classList.add('notes__text');
            text.setAttribute('readonly', 'readonly');
            text.textContent = `${note.text}`;

            const wrap = document.createElement('div');
            wrap.classList.add('notes__wrap');

            const doneButton = document.createElement('button');
            doneButton.classList.add('notes__button', 'notes__button_done');
            doneButton.textContent = 'Done';

            const removeButton = document.createElement('button');
            removeButton.classList.add('notes__button', 'notes__button_remove');
            removeButton.textContent = 'Remove';

            wrap.append(doneButton, removeButton);
            listItem.append(title, text, wrap);

            if (note.isDone === true) {
                title.classList.add('done');
                text.classList.add('done');
                doneButton.textContent = 'Undone';
                listDone.append(listItem);
            } else {
                listTodo.append(listItem);
            }
        }
        list.append(listTodo, listDone);

        localStorage.setItem('noteList', JSON.stringify(this.model.noteList));
    }

    initSubmit() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();

            const fromData = new FormData(e.target);
            const formTitle = fromData.get('title').trim();
            const formText = fromData.get('text').trim();

            if (formTitle && formText) {
                this.model.addNote(formTitle, formText);
            }
            e.target.reset();

            this.renderList();
        });
    }

    initRemove() {
        this.cards.addEventListener('click', (e) => {
            if (e.target.classList.contains('notes__button_remove')) {
                const idTitle = e.target.closest('.notes__item').getAttribute('id');
                this.model.deleteNote(idTitle);
            }

            this.renderList();
        });
    }

    initToggle() {
        this.cards.addEventListener('click', (e) => {
            if (e.target.classList.contains('notes__button_done')) {
                const idTitle = e.target.closest('.notes__item').getAttribute('id');
                this.model.toggleIsDone(idTitle);
            }

            this.renderList();
        });

        this.renderList();
    }
}

const noteModel = new ToDoModel();
const noteView = new ToDoView(noteModel);
noteView.initSubmit();
noteView.initRemove();
noteView.initToggle();