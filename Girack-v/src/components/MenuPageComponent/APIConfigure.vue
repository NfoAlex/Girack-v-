<script>

export default {

  data() {
    return {
      displayDialogRegister: false,
    }
  },

  mounted() {
    console.log("API...?");
  }

}

</script>

<template>
  <div>

    <v-dialog v-model="displayDialogRegister">
      <v-card>
        asdf
      </v-card>
    </v-dialog>

    <div class="mx-auto d-flex flex-column" style="width:90%;height:100vh;">
      <div class="d-flex align-center my-3">
        <p class="text-truncate me-auto" style="font-size: min(4vh, 36px)">
        API管理
        </p>
        <v-btn
          color="primary"
          size="large"
          class="rounded-lg"
          icon="mdi:mdi-plus"
        >
        </v-btn>
      </div>
    </div>

  </div>
</template>