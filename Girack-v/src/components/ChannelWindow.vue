<script>
import Content from "./ChannelComponent/Content.vue";
import Head from "./ChannelComponent/Head.vue";
import Input from "./ChannelComponent/Input.vue";

export default {
    components: {
        Content,
        Head,
        Input
    },

    data() {
        return {
            w: "w",
            head: "head",
            content: "content",
            input: "input"
        }
    }

}

</script>

<template>
    <div :class="[w,head]">
        <Head />
    </div>
    <div :class="[w,content]">
        <Content />
    </div>
    <div :class="[w,input]">
        <Input />
    </div>
    
</template>

<style scoped>

.w
{
    width: 100%;
    margin: 0 0;
    box-sizing: border-box;
}
.head
{
    height: 10vh;
    border-bottom: solid 0.1px #424242;
}

.content
{
    height: 82vh;
}

.input
{
    height: 7vh;
}

</style>