<script>

export default {
    props: ["userid"],

}

</script>

<template>
    <v-card class="mx-auto userpage">
        <p>これがUserpage 😏</p>
        <p>{{ userid }}</p>
    </v-card>
</template>

<style scoped>

.userpage
{
    width: 100%;
    height:50vh;
}

</style>