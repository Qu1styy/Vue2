Vue.component('note-card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        lockChecked: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        emitUpdate() {
            if (!this.disabled) {
                this.$emit('update');
            }
        }
    },
    template: `
        <article class="card mb-3">
            <div class="card-body">
                <h3 class="h6 card-title mb-2">{{ card.title }}</h3>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item px-0" v-for="(item, index) in card.items" :key="index">
                        <label class="form-check m-0">
                            <input
                                class="form-check-input me-2"
                                type="checkbox"
                                v-model="item.done"
                                :disabled="disabled || (lockChecked && item.done)"
                                @change="emitUpdate"
                            >
                            <span class="form-check-label">{{ item.text }}</span>
                        </label>
                    </li>
                </ul>
                <div v-if="card.completedAt" class="text-muted small mt-2">
                    Дата завершения: {{ card.completedAt }}
                </div>
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
            return filledItems >= 3 && filledItems <= 5 && filledItems === this.newCard.items.length;
        }
    },
    methods: {
        addItem() {
            if (this.newCard.items.length >= 5) {
                return;
            }
            this.newCard.items.push({ text: '', done: false });
        },
        removeItem(index) {
            if (this.newCard.items.length <= 3) {
                return;
            }
            this.newCard.items.splice(index, 1);
        },
        createCard() {
            if (!this.canCreateCard) {
                return;
            }
            const card = {
                id: Date.now(),
                title: this.newCard.title.trim(),
                items: this.newCard.items.map((item) => ({
                    text: item.text.trim(),
                    done: false
                })),
                completedAt: null
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
        update() {
            this.moveCards();
            this.save();
        },
        moveCards() {
            this.todo = this.todo.filter((card) => {
                const p = this.getProgress(card);
                if (p === 1) {
                    this.finish(card);
                    this.done.push(card);
                    return false;
                }
                if (p >= 0.5 && this.progress.length < 5) {
                    this.progress.push(card);
                    return false;
                }
                return true;
            });

            this.progress = this.progress.filter((card) => {
                if (this.getProgress(card) === 1) {
                    this.finish(card);
                    this.done.push(card);
                    return false;
                }
                return true;
            });
        },
        getProgress(card) {
            if (!card.items.length) {
                return 0;
            }
            return card.items.filter((item) => item.done).length / card.items.length;
        },
        finish(card) {
            card.completedAt = new Date().toLocaleString();
        },
        clearDone() {
            if (this.done.length === 0) {
                return;
            }
            if (!confirm('Очистить выполненное?')) {
                return;
            }
            this.done = [];
            this.save();
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
