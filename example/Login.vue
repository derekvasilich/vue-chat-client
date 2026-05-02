<script setup lang="ts">
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
import { Amplify, ResourcesConfig } from 'aws-amplify';
import App from './App.vue';
const userPoolId = import.meta.env.VITE_AWS_USER_POOL_ID
const userPoolClientId = import.meta.env.VITE_AWS_POOL_CLIEN_ID
const config: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
    }
  }
};
Amplify.configure(config);
</script>

<template>        
    <Authenticator>
      <template v-slot="{ signOut, user }">
        <Suspense>
            <App :user="user" :signOut="signOut"/>
        </Suspense>
      </template>
    </Authenticator>
</template>

<style>
[data-amplify-authenticator] {
    display: flex;
    height: 100vh;
    width: 100vw;
    align-items: center;
    justify-content: center;
}
</style>