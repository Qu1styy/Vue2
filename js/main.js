Vue.component('note-card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        emitUpdate() {
            this.$emit('update', this.card);
        }
    },
    template: `
        <article class="note-card">
            <h3>{{ card.title }}</h3>
            <ul>
                <li v-for="(item, index) in card.items" :key="index">
                    <label>
                        <input
                            type="checkbox"
                            v-model="item.done"
                            :disabled="disabled"
                            @change="emitUpdate"
                        >
                        {{ item.text }}
                    </label>
                </li>
            </ul>
            <div v-if="card.completedAt" class="note-card-date">
                Дата завершения: {{ card.completedAt }}
            </div>
        </article>
    `
});

new Vue({
    el: '#app',
    data() {
        return {
            columns: ['To Do', 'In Progress', 'Done'],
            todo: [],
            progress: [],
            done: [],
            newCard: {
                title: '',
                items: [
                    { text: '', done: false },
                    { text: '', done: false },
                    { text: '', done: false }
                ]
            }
        };
    },
    mounted() {
        this.load();
    },
    computed: {
        todoLocked() {
            return this.progress.length >= 5;
        },
        canCreateCard() {
            if (this.todo.length >= 3) {
                return false;
            }
            if (!this.newCard.title.trim()) {
                return false;
            }
            const filledItems = this.newCard.items.filter(
                (item) => item.text && item.text.trim().length > 0
            ).length;
            return filledItems >= 3 && filledItems <= 5;
        }
    },
    methods: {
        createCard() {
            if (!this.canCreateCard) {
                return;
            }
            const card = {
                id: Date.now(),
                title: this.newCard.title.trim(),
                items: this.newCard.items
                    .filter((item) => item.text && item.text.trim().length > 0)
                    .map((item) => ({
                        text: item.text.trim(),
                        done: false
                    })),
                completedAt: ''
            };
            this.todo.push(card);
            this.newCard = {
                title: '',
                items: [
                    { text: '', done: false },
                    { text: '', done: false },
                    { text: '', done: false }
                ]
            };
            this.save();
        },
        update(card) {
            const target = this.progressStage(card);
            this.moveCards(card, target);
            this.finish(card, target);
            this.save();
        },
        moveCards(card, target) {
            const lists = [this.todo, this.progress, this.done];
            lists.forEach((list) => {
                const index = list.findIndex((c) => c.id === card.id);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            });
            if (target === 'todo') {
                this.todo.push(card);
                return;
            }
            if (target === 'progress') {
                this.progress.push(card);
                return;
            }
            this.done.push(card);
        },
        progressStage(card) {
            const total = card.items.length;
            const doneCount = card.items.filter((item) => item.done).length;
            if (total > 0 && doneCount === total) {
                return 'done';
            }
            if (doneCount > 0) {
                return 'progress';
            }
            return 'todo';
        },
        finish(card, target) {
            if (target === 'done') {
                card.completedAt = new Date().toLocaleDateString();
            } else {
                card.completedAt = '';
            }
        },
        save() {
            const payload = {
                todo: this.todo,
                progress: this.progress,
                done: this.done
            };
            localStorage.setItem('kanban', JSON.stringify(payload));
        },
        load() {
            const raw = localStorage.getItem('kanban');
            if (!raw) {
                return;
            }
            const data = JSON.parse(raw);
            this.todo = Array.isArray(data.todo) ? data.todo : [];
            this.progress = Array.isArray(data.progress) ? data.progress : [];
            this.done = Array.isArray(data.done) ? data.done : [];
        }
    }
});
