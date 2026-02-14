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
        onChange() {
            if (!this.disabled) {
                this.$emit('update');
            }
        }
    },
    template: `
        <div class="card">
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
                                @change="onChange"
                            >
                            <span class="form-check-label">{{ item.text }}</span>
                        </label>
                    </li>
                </ul>
                <small v-if="card.completedAt" class="text-muted d-block mt-2">Completed: {{ card.completedAt }}</small>
            </div>
        </div>
    `
});

Vue.component('create-card', {
    data() {
        return {
            title: '',
            items: [
                { text: '', done: false },
                { text: '', done: false },
                { text: '', done: false }
            ]
        };
    },
    computed: {
        canCreate() {
            if (!this.title.trim()) {
                return false;
            }
            const filled = this.items.filter((item) => item.text && item.text.trim().length > 0).length;
            return filled >= 3 && filled <= 5 && filled === this.items.length;
        }
    },
    methods: {
        addItem() {
            if (this.items.length < 5) {
                this.items.push({ text: '', done: false });
            }
        },
        removeItem(index) {
            if (this.items.length > 3) {
                this.items.splice(index, 1);
            }
        },
        create() {
            if (!this.canCreate) {
                return;
            }
            const payload = {
                title: this.title.trim(),
                items: this.items.map((item) => ({
                    text: item.text.trim(),
                    done: false
                }))
            };
            this.$emit('create', payload);
            this.title = '';
            this.items = [
                { text: '', done: false },
                { text: '', done: false },
                { text: '', done: false }
            ];
        }
    },
    template: `
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <form class="create-card" @submit.prevent="create">
                    <div class="mb-2">
                        <input v-model="title" type="text" class="form-control" placeholder="Заголовок">
                    </div>
                    <div class="mb-2" v-for="(item, index) in items" :key="index">
                        <div class="input-group">
                            <input v-model="item.text" type="text" class="form-control" placeholder="Пункт">
                            <button type="button" class="btn btn-outline-secondary" @click="removeItem(index)" :disabled="items.length <= 3">−</button>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary" :disabled="!canCreate">Создать</button>
                        <button type="button" class="btn btn-outline-primary" @click="addItem" :disabled="items.length >= 5">Добавить пункт</button>
                    </div>
                </form>
            </div>
        </div>
    `
});

Vue.component('board-column', {
    props: {
        title: {
            type: String,
            required: true
        },
        cards: {
            type: Array,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        priorityLocked: {
            type: Boolean,
            default: false
        },
        isDoneColumn: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        lockChecked() {
            return this.title.indexOf('Progress') !== -1;
        }
    },
    methods: {
        emitUpdate() {
            this.$emit('update');
        },
        emitPriority(card) {
            this.$emit('priority', card);
        },
        emitClear() {
            this.$emit('clear');
        }
    },
    template: `
        <div class="col-12 col-lg-4">
            <div class="border rounded p-3 bg-white h-100">
                <div class="d-flex align-items-center justify-content-between mb-3" v-if="isDoneColumn">
                    <h2 class="h5 mb-0">{{ title }}</h2>
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="emitClear" :disabled="cards.length === 0">Очистить</button>
                </div>
                <h2 class="h5 mb-3" v-else>{{ title }}</h2>
                <div class="d-flex flex-column gap-3">
                <note-card
                    v-for="card in cards"
                    :key="card.id"
                    :card="card"
                    :disabled="disabled"
                    :lock-checked="lockChecked"
                    @update="emitUpdate"
                    @click.native="emitPriority(card)"
                ></note-card>
            </div>
            </div>
        </div>
    `
});

new Vue({
    el: '#app',
    data: {
        columns: {
            todo: [],
            progress: [],
            done: []
        },
        hasActivePriority: false
    },
    computed: {
        todoLocked() {
            return this.columns.progress.length >= 5;
        }
    },
    methods: {
        addCard(payload) {
            this.columns.todo.push({
                id: Date.now(),
                title: payload.title,
                items: payload.items,
                completedAt: null
            });
            this.save();
        },
        update() {
            this.moveCards();
            this.save();
        },
        moveCards() {
            this.columns.todo = this.columns.todo.filter((card) => {
                const p = this.getProgress(card);
                if (p === 1) {
                    this.finish(card);
                    this.columns.done.push(card);
                    return false;
                }
                if (p >= 0.5 && this.columns.progress.length < 5) {
                    this.columns.progress.push(card);
                    return false;
                }
                return true;
            });

            this.columns.progress = this.columns.progress.filter((card) => {
                if (this.getProgress(card) === 1) {
                    this.finish(card);
                    this.columns.done.push(card);
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
            if (this.columns.done.length === 0) {
                return;
            }
            if (!confirm('Очистить?')) {
                return;
            }
            this.columns.done = [];
            this.save();
        },
        setPriority() {
        },
        save() {
            localStorage.setItem('notes', JSON.stringify(this.columns));
        },
        load() {
            const data = localStorage.getItem('notes');
            if (data) {
                this.columns = JSON.parse(data);
            }
        }
    },
    mounted() {
        this.load();
    }
});
