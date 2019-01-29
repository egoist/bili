<template>
  <div class="main-content">
    <h1>This is your first component in Vue</h1>
    <h3>{{ name }}</h3>
  </div>
</template>

<script>
export default {
  name: 'main-content',
  data: () => ({
    name: 'Bili !'
  })
}
</script>

<style scoped>
.main-content {
  margin: 0 auto;
  font-family: sans-serif;
  background-color: #ccf7e2;
  padding: 10px;
  border-radius: 5px;
  max-width: 500px;
}
</style>
