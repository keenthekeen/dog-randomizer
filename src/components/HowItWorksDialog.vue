<script setup lang="ts">
import {computed, onMounted, onUnmounted, watch} from 'vue';

const props = defineProps<{
  show: boolean,
  maxWidth?: string,
}>();

const emit = defineEmits(['close']);

watch(() => props.show, () => {
  if (props.show) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const close = () => {
  emit('close');
};

const closeOnEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    close();
  }
};

onMounted(() => document.addEventListener('keydown', closeOnEscape));

onUnmounted(() => {
  document.removeEventListener('keydown', closeOnEscape);
  document.body.style.overflow = '';
});

const maxWidthClass = computed(() => {
  return {
    'sm': 'sm:max-w-sm',
    'md': 'sm:max-w-md',
    'lg': 'sm:max-w-lg',
    'xl': 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl'
  }[props.maxWidth ?? '2xl'];
});
</script>

<style scoped>
ol > li {
  margin-top: 0.4rem;
}
</style>

<template>
  <teleport to="body">
    <transition leave-active-class="duration-200">
      <div v-show="show" class="fixed inset-0 overflow-y-auto px-4 py-6 sm:px-0 z-50" scroll-region>
        <transition
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
          <div v-show="show" class="fixed inset-0 transform transition-all" @click="close">
            <div class="absolute inset-0 bg-gray-500 opacity-75"/>
          </div>
        </transition>

        <transition
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div v-show="show" class="mb-6 bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:w-full sm:mx-auto" :class="maxWidthClass">
            <div class="px-6 py-4">
              <div class="font-bold text-lg">
                How it works?
              </div>

              <div class="mt-4">
                <p class="my-2">
                  In medical students' lives, there are situations requiring randomization, such as night shift schedule allocation and group work distribution.
                  Usually, one of the students will be assigned to generate a random number and share it with the group.
                  However, this method requires trust in the assigned peer and can be tampered with.<br />
                </p>
                <p class="my-2">
                  One solution to this problem is to use a public random number generator.
                  This concept is comparable to the use of lottery results to determine the winner.
                  Everyone trusts the lottery result, no one can tamper with it nor be able to predict the result.
                </p>
                <p class="my-2">
                  The U.S. National Institute of Standards and Technology (NIST)'s
                  <a href="https://csrc.nist.gov/Projects/interoperable-randomness-beacons/beacon-20" target="_blank" class="text-red-500">
                    Randomness Beacon</a> applies the similar concept, but with modern cryptography to ensure unpredictability,
                  unbiasability, and verifiability. It generates and publishes a random value every 60 seconds.
                </p>
                <p class="my-2">
                  This application then uses that value as a seed to generate a random number with user-configured conditions.
                  Therefore, the generated number is reproducible and verifiable.
                </p>

                <h3 class="mt-6 leading-4 text-lg">How to use</h3>
                <ol class="m-4 list-decimal list-outside">
                  <li>The user set the mode of randomization as wanted, but set the time in the future (for example, in the next 15 minutes).</li>
                  <li>The user sends a configured URL to the group.</li>
                  <li>Everyone can view random result after the set time. No one can tamper with the result.</li>
                </ol>
              </div>
            </div>

            <div class="flex flex-row justify-end px-6 py-4 bg-gray-100 text-right">
              <button @click="close" class="px-2 rounded hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>
