<script setup>
import TopNav from './views/TopNav.vue';

// 启动的时候就进行AutoLogin
import { useUserStore } from './stores/user';

const userStore = useUserStore();

// AutoLogin
userStore.autoLogin();

</script>

<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>


<style scoped>

</style>
