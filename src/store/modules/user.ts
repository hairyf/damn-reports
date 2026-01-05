import { defineStore } from 'valtio-define'

export const user = defineStore({
  state: () => ({
    name: '',
    age: 0,
  }),
  actions: {
    setName(name: string) {
      this.name = name
    },
    setAge(age: number) {
      this.age = age
    },
  },
})
