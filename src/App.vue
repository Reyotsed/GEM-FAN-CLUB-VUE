<script setup>
// 启动的时候就进行AutoLogin
import { useUserStore } from './stores/user';
import UserProfileCardModal from './components/user/UserProfileCardModal.vue';

const userStore = useUserStore();

// AutoLogin
userStore.autoLogin();

</script>

<template>
  <div id="app">
    <router-view></router-view>
    <UserProfileCardModal />
  </div>
</template>


<style scoped>

</style>
