<script setup lang="ts">
import Home from './components/Home.vue';
import {SunIcon} from '@heroicons/vue/20/solid';
import HowItWorksDialog from './components/HowItWorksDialog.vue';
import {ref} from 'vue';

const showHowDialog = ref(false);
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
};
</script>

<template>
  <HowItWorksDialog :show="showHowDialog" @close="showHowDialog = false" />
  <div class="relative flex items-top justify-center min-h-screen bg-gray-50 dark:bg-gray-800 dark:text-gray-100 sm:items-center sm:pt-0">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-0">
      <div class="flex justify-center pt-8">
        <a href="/">
          <h1 class="text-5xl sm:text-6xl font-extrabold md:px-4 lg:px-12">
            <span class="text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-rose-700">Dog</span>
            <span class="text-4xl">&ensp;🐶&ensp;</span>
            <span class="text-gray-700 dark:text-gray-200">Randomizer</span>
          </h1>
        </a>
      </div>

      <div class="mt-8">
        <Home />
      </div>

      <div class="mt-12 mb-4 text-xs font-light text-gray-400 dark:text-gray-300 text-center">
        Created with ❤ by Keen&nbsp;|&nbsp;
        <a @click="showHowDialog = true" class="cursor-pointer text-slate-400 dark:text-slate-400 hover:underline hover:text-gray-400 dark:hover:text-gray-300">How it works?</a>&nbsp;|&nbsp;
        <a href="https://github.com/keenthekeen/dog-randomizer" target="_blank" class="text-slate-400 dark:text-slate-400 hover:underline hover:text-gray-400 dark:hover:text-gray-300">Source Code</a>&nbsp;|&nbsp;
        <SunIcon @click="toggleDarkMode" title="Toggle dark theme"
                 class="inline-block h-5 cursor-pointer text-slate-300 dark:text-slate-500 hover:underline hover:text-gray-400 dark:hover:text-gray-300"/>
      </div>
    </div>
  </div>
</template>
