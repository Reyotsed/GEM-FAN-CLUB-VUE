<template>
    <TopNav />
    <router-view v-slot="{ Component, route }">
        <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
        </transition>
    </router-view>
    <Live2D />
</template>

<script setup>
import TopNav from '@/views/TopNav.vue';
import Live2D from '@/components/Live2D.vue';
</script>