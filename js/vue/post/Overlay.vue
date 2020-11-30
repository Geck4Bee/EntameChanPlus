<template>
<v-layout row justify-center>
<v-dialog persistent v-model='$store.state.posting' max-width='400'>
<v-card class='pa-3' color='secundary'> <div class='headline'>Processing post...</div>
<div class='headline'>Please wait.</div>
<v-progress-linear v-model='$store.state.progress'></v-progress-linear>
</v-card>
</v-dialog>
</v-layout>
</template>
