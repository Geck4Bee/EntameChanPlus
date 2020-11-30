<template>
<v-layout row justify-center>
<v-dialog persistent v-model='$store.state.processing' max-width='400'>
<v-card class='pa-3' color='secundary'>
<div class='headline'>{{$store.state.processing_message}}</div>
<div class='headline'>Please wait.</div>
</v-card>
<v-progress-linear indeterminate></v-progress-linear>
</v-dialog>
</v-layout>
</template>
