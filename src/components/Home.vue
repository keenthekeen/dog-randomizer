<script setup lang="ts">
import {CheckIcon, ChevronRightIcon, XMarkIcon} from '@heroicons/vue/20/solid';
import {CalculatorIcon, ChevronUpDownIcon, HashtagIcon, TagIcon, QueueListIcon} from '@heroicons/vue/24/outline';
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {debounce} from 'lodash';
import {Pulse} from '../nist-pulse';
import {Randomizer} from '../randomizer';

const now = new Date();
now.setMinutes(now.getMinutes() - 1);
now.setSeconds(0);
now.setMilliseconds(0);
const maxDate = new Date();
maxDate.setFullYear(now.getFullYear() + 1);
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const timezoneOffset = now.getTimezoneOffset();
const dateToString = (date: Date) => {
  const convertedDate = new Date(date.valueOf()); // copy date value to prevent making change to original date
  convertedDate.setMinutes(convertedDate.getMinutes() - timezoneOffset); // set to local timezone
  return convertedDate.toISOString().substring(0, 16);
};
const time = ref(now); // selected time, in UTC
let timeWatcher: number | null = null;
const timeString = computed({
  get: () => dateToString(time.value),
  set: (newValue) => {
    time.value = new Date(newValue); // recognize user's timezone by default
    if (timeWatcher) {
      clearTimeout(timeWatcher);
    }
    if (time.value > new Date()) {
      // future time, let's set a timer to randomize
      timeWatcher = setTimeout(fetchPulse, time.value.valueOf() + 10000 - (new Date()).valueOf());
    }
  }
});
const randomPulse = ref<Pulse | null>(null);
const fetchPulse = async () => {
  if (time.value) {
    randomPulse.value = null;
    if (time.value <= new Date()) {
      try {
        const res = await fetch('https://beacon.nist.gov/beacon/2.0/pulse/time/' + time.value.valueOf());
        const pulse: Pulse = (await res.json()).pulse;
        randomPulse.value = {
          ...pulse,
          trimmedRandomValue: pulse.localRandomValue.substring(0, 13)
        };
        settings.result = null;
        if (window.location.search.includes('mode=')) {
          randomize();
        }
      } catch (error) {
        console.error('Could not reach the API. ' + error);
      }
    }
  }
};
watch(time, debounce(fetchPulse, 500));
const settings = reactive<{ mode: 'number' | 'random' | 'shuffle' | 'pick' | 'assign', n: number, min: number, max: number, list: string, roles: string, result: null | number | number[] | string[] | { list: string[], roles: string[] } }>({
  mode: 'number',
  n: 1,
  min: 1,
  max: 100,
  list: '',
  roles: '',
  result: null
});
const setMode = (mode: 'number' | 'random' | 'shuffle' | 'pick' | 'assign') => {
  if (settings.mode !== mode && !settings.result) {
    settings.mode = mode;
    settings.result = null;
  }
};
const listArray = computed(() => settings.list.split("\n").map(s => s.trim()).filter(s => s).sort());
const listContainsDuplicate = computed(() => new Set(listArray.value).size !== listArray.value.length);
const rolesArray = computed(() => settings.roles.split("\n").map(s => s.trim()).filter(s => s).sort());
const randomDog = ref<string | null>(null);
const randomize = () => {
  if (!randomPulse.value) {
    return;
  }
  const randomizer = new Randomizer(randomPulse.value.trimmedRandomValue);
  if (settings.mode === 'number') {
    if (!settings.min || !settings.max) {
      return;
    }
    settings.result = randomizer.randomIntBetween(settings.min, settings.max);

    // Get a dog
    fetch('https://dog.ceo/api/breeds/image/random')
        .then(response => response.json())
        .then(data => {
          randomDog.value = data.message;
        });
  } else if (settings.mode === 'pick') {
    if (listArray.value.length < 2) {
      return;
    }
    settings.result = randomizer.randomMemberofArray(settings.n, listArray.value);
  } else if (settings.mode === 'shuffle') {
    if (listArray.value.length < 2) {
      return;
    }
    settings.result = randomizer.shuffleArray(listArray.value);
  } else if (settings.mode === 'random') {
    if (settings.n < 1) {
      return;
    }
    settings.result = (new Array(settings.n)).fill(0).map(() => randomizer.randomFloat());
  } else if (settings.mode === 'assign') {
    if (!listArray.value.length || !rolesArray.value.length) {
      return;
    }
    settings.result = {
      list: randomizer.shuffleArray(listArray.value),
      roles: randomizer.shuffleArray(rolesArray.value)
    };
  }
};
const settingsToUrl = {
  number: ['min', 'max'],
  random: ['n'],
  pick: ['n', 'list'],
  shuffle: ['list'],
  assign: ['list', 'roles']
};
const shareUrl = computed(() => {
  // @ts-ignore
  if (!settings.mode || !timeString.value || settingsToUrl[settings.mode].filter(key => !settings[key]).length) {
    return null;
  }
  const url = new URL(window.location.protocol + '//' + window.location.host + window.location.pathname); // URL without query parameters
  url.searchParams.set('time', timeString.value);
  url.searchParams.set('mode', settings.mode);
  settingsToUrl[settings.mode].forEach(key => {
    // @ts-ignore
    url.searchParams.set(key, settings[key]);
  });
  return url.toString();
});
onMounted(() => {
  const urlInput = new URL(window.location.href);
  if (urlInput.searchParams.has('mode') && urlInput.searchParams.has('time')) {
    ['mode', 'list', 'roles'].forEach(key => {
      if (urlInput.searchParams.has(key)) {
        // @ts-ignore
        settings[key] = urlInput.searchParams.get(key);
      }
    });
    ['min', 'max', 'n'].forEach(key => {
      if (urlInput.searchParams.has(key)) {
        // @ts-ignore
        settings[key] = parseInt(urlInput.searchParams.get(key));
      }
    });
    timeString.value = urlInput.searchParams.get('time')!;
  } else {
    fetchPulse();
  }
});
</script>

<style scoped>
li::marker {
  @apply font-mono;
}
</style>

<template>
  <form @submit.prevent="$emit('submit', settings)">
    <div class="border-b mb-4">
      <div v-if="!settings.result" class="mb-4">
        <label for="datetime" class="block text-sm font-medium text-gray-700 dark:text-gray-500">Time of Beacon Pulse</label>
        <div class="relative mt-1 rounded-md shadow-sm">
          <input type="datetime-local" id="datetime" :disabled="settings.result"
                 class="block w-full rounded-md border-gray-300 focus:border-red-400 dark:focus:border-red-800 focus:ring-red-400 dark:focus:ring-red-800 sm:text-sm dark:bg-gray-800 dark:text-gray-200"
                 :class="{ 'border-red-300 focus:border-red-400': !time }"
                 v-model="timeString" min="2022-12-01T00:00" :max="dateToString(maxDate)" step="60"/>
        </div>
      </div>
      <p v-if="!randomPulse" class="mb-4 text-xs text-gray-500">
        <template v-if="time">{{ time }} <span v-if="time > new Date()" class="italic font-bold text-red-500">(Future)</span></template>
        <template v-else>Timezone: {{ timezone }} (
          <template v-if="timezoneOffset<0">+</template>
          {{ -timezoneOffset / 60 }})
        </template>
      </p>
      <div v-if="randomPulse" class="mb-4 break-all">
        <p class="text-xs text-gray-400">Randomness provided by <a href="https://csrc.nist.gov/Projects/interoperable-randomness-beacons/beacon-20" target="_blank" class="text-gray-500">NIST
          Randomness Beacon</a></p>
        Pulse <span class="font-mono text-red-600">#{{ randomPulse.pulseIndex }}</span> at <span class="text-red-700">{{ new Date(randomPulse.timeStamp) }}</span>:
        <span class="font-mono text-sm text-red-400 dark:text-red-800" title="52-bit randomness from NIST">{{ randomPulse.trimmedRandomValue }}</span>
      </div>
    </div>
    <div class="flex flex-col sm:flex-row gap-6">
      <div class="basis-1/2">
        <ul class="space-y-2 text-gray-800 dark:text-gray-300">
          <li>
            <a @click="setMode('number')" :class="{'ring-2 ring-red-600': settings.mode === 'number', 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700': !settings.result}"
               class="flex items-center p-2 text-base font-normal rounded-lg group">
              <HashtagIcon class="w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
              <span class="ml-3">Random one number</span>
            </a>
          </li>
          <li>
            <a @click="setMode('random')" :class="{'ring-2 ring-red-600': settings.mode === 'random', 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700': !settings.result}"
               class="flex items-center p-2 text-base font-normal rounded-lg group">
              <CalculatorIcon class="w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
              <span class="ml-3">Random multiple numbers (0-1)</span>
            </a>
          </li>
          <li>
            <a @click="setMode('pick')" :class="{'ring-2 ring-red-600': settings.mode === 'pick', 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700': !settings.result}"
               class="flex items-center p-2 text-base font-normal rounded-lg group">
              <QueueListIcon class="w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
              <span class="ml-3">Pick from the list</span>
            </a>
          </li>
          <li>
            <a @click="setMode('shuffle')" :class="{'ring-2 ring-red-600': settings.mode === 'shuffle', 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700': !settings.result}"
               class="flex items-center p-2 text-base font-normal rounded-lg group">
              <ChevronUpDownIcon class="w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
              <span class="ml-3">Shuffle the list</span>
            </a>
          </li>
          <li>
            <a @click="setMode('assign')" :class="{'ring-2 ring-red-600': settings.mode === 'assign', 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700': !settings.result}"
               class="flex items-center p-2 text-base font-normal rounded-lg group">
              <TagIcon class="w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
              <span class="ml-3">Assign role to the list</span>
            </a>
          </li>
        </ul>
      </div>
      <div class="basis-1/2 flex flex-col justify-center items-stretch gap-4 text-black dark:text-white">
        <div v-if="settings.mode === 'number'">
          between
          <div class="inline-block relative rounded-md shadow-sm">
            <input type="number" v-model.number="settings.min" placeholder="Min" min="1" step="1" :disabled="settings.result"
                   class="block w-20 rounded-md border-gray-300 focus:border-red-400 dark:focus:border-red-800 focus:ring-red-400 dark:focus:ring-red-800 sm:text-sm dark:bg-gray-800 dark:text-gray-200"/>
          </div>
          and
          <div class="inline-block relative rounded-md shadow-sm">
            <input type="number" v-model.number="settings.max" placeholder="Max" min="2" step="1" :disabled="settings.result"
                   class="block w-20 rounded-md border-gray-300 focus:border-red-400 dark:focus:border-red-800 focus:ring-red-400 dark:focus:ring-red-800 sm:text-sm dark:bg-gray-800 dark:text-gray-200"/>
          </div>
        </div>
        <div v-if="settings.mode === 'random'">
          <label for="random-n" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Amount of values</label>
          <div class="relative mt-1 rounded-md shadow-sm">
            <input type="number" id="random-n" v-model.number="settings.n" placeholder="n" min="1" step="1" :disabled="settings.result"
                   class="block w-full rounded-md border-gray-300 focus:border-red-400 dark:focus:border-red-800 focus:ring-red-400 dark:focus:ring-red-800 sm:text-sm dark:bg-gray-800 dark:text-gray-200"/>
          </div>
        </div>
        <div v-if="settings.mode === 'pick'" class="grow">
          <div class="mb-2">
            pick
            <div class="inline-block relative rounded-md shadow-sm">
              <input type="number" v-model.number="settings.n" placeholder="n" min="1" step="1" :disabled="settings.result"
                     class="block w-20 rounded-md border-gray-300 focus:border-red-400 dark:focus:border-red-800 focus:ring-red-400 dark:focus:ring-red-800 sm:text-sm dark:bg-gray-800 dark:text-gray-200"/>
            </div>
            from
          </div>
        </div>
        <div v-if="['shuffle', 'pick', 'assign'].includes(settings.mode)" class="grow">
          <label for="list" class="block text-sm font-medium text-gray-700 dark:text-gray-400">List, one member per line</label>
          <div class="relative mt-1 rounded-md shadow-sm">
            <textarea id="list" v-model.trim="settings.list" :disabled="settings.result"
                      class="block w-full rounded-md border-gray-300 focus:border-red-400 dark:focus:border-red-800 focus:ring-red-400 dark:focus:ring-red-800 sm:text-sm dark:bg-gray-800 dark:text-gray-200"
                      :placeholder='"Jane\nBob\nAlice"' rows="4"/>
          </div>
        </div>
        <div v-if="settings.mode === 'assign'" class="grow">
          <label for="roles" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Roles, one per line</label>
          <div class="relative mt-1 rounded-md shadow-sm">
            <textarea id="roles" v-model.trim="settings.roles" :disabled="settings.result"
                      class="block w-full rounded-md border-gray-300 focus:border-red-400 dark:focus:border-red-800 focus:ring-red-400 dark:focus:ring-red-800 sm:text-sm dark:bg-gray-800 dark:text-gray-200"
                      :placeholder='"Diagnosis\nInvestigation\nTreatment"' rows="4"/>
          </div>
        </div>
      </div>
    </div>
    <button type="submit" @click="randomize" v-if="!settings.result" :disabled="!randomPulse"
            :class="{ 'border-slate-700 dark:border-slate-300 text-slate-700 dark:text-slate-300': randomPulse, 'border-gray-300 text-gray-300 dark:border-gray-800 dark:text-gray-800': !randomPulse }"
            class="mt-8 group relative flex w-full justify-center rounded-md py-2 px-4 text-sm font-medium border-2 hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
              <ChevronRightIcon class="h-5 w-5" aria-hidden="true"/>
            </span>
      Random
    </button>
    <div v-if="settings.result" class="relative mt-8 p-3 rounded border-2 border-red-800 dark:border-red-500 bg-white dark:bg-gray-900">
      <p class="font-bold text-sm text-red-800 dark:text-red-500">Result</p>
      <XMarkIcon @click="settings.result = null" class="h-8 w-8 text-red-700 absolute top-1 right-1 cursor-pointer"/>
      <div v-if="settings.mode === 'number'">
        Selected number is {{ settings.result }}
        <div v-if="randomDog" class="relative w-60 h-60 overflow-hidden">
          <img :src="randomDog" alt="A dog" class="object-cover w-full h-full"/>
          <div class="absolute w-full py-4 bottom-0 inset-x-0 font-bold text-4xl text-white text-center leading-4">Dog {{ settings.result }}</div>
        </div>
      </div>
      <div v-else-if="settings.mode === 'pick' && Array.isArray(settings.result)">
        <ol class="list-decimal list-outside pl-8">
          <li v-for="item in (listContainsDuplicate ? settings.result : listArray)" :key="item" :class="{'font-bold text-red-600': settings.result.includes(item.trim())}">
            {{ item }}
            <CheckIcon v-if="settings.result.includes(item.trim())" class="inline-block h-4 w-4 text-red-600"/>
          </li>
        </ol>
      </div>
      <div v-else-if="['shuffle', 'random'].includes(settings.mode) && Array.isArray(settings.result)">
        <ol class="list-decimal list-outside pl-8">
          <li v-for="item in settings.result" :key="item">{{ item }}</li>
        </ol>
      </div>
      <div v-else-if="settings.mode === 'assign' && Array.isArray(settings.result.list) && Array.isArray(settings.result.roles)">
        <div class="sm:mr-6 shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 tracking-wider">List</th>
              <th scope="col" class="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Role</th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, i) in settings.result.list">
              <td class="px-2 py-2 md:px-4 md:py-3">{{ item }}</td>
              <td class="px-2 py-2 md:px-4 md:py-3">{{ settings.result.roles[i] ?? '-' }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <p v-if="shareUrl" class="text-center text-sm mt-4 text-gray-500 dark:text-gray-400">
      Share: <a :href="shareUrl" class="text-gray-400 dark:text-gray-500">{{ shareUrl }}</a>
    </p>
  </form>
</template>
