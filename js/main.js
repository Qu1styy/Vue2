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
            columns: ['To Do', 'In Progress', 'Done']
        };
    }
});
