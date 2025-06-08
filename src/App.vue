<script setup lang="ts">
import { RouterView } from 'vue-router'
import ErrorBoundary from './components/ErrorBoundary.vue'
import GlobalLoading from './components/GlobalLoading.vue'
</script>

<template>
  <div id="app">
    <ErrorBoundary>
      <GlobalLoading />
      <RouterView />
    </ErrorBoundary>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}
</style>
