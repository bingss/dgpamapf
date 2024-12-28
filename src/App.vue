<template>
    <!-- html -->

    <div class="container-fluid g-0">
        <div class="sticky-top">
            <Header></Header>
        </div>
        <div class="row gx-0">
            <div class="col-9 position-fixed" style="position:absolute; top: 0;">
                <Map></Map>
            </div>
            <div class="col-3 ms-auto p-0" >
                <Side></Side>
            </div>
        </div>
    </div>

</template>



<script setup lang="ts" name="App">
    import Header from './views/Header.vue';
    import Map from './views/Map.vue';
    import Side from './views/Side.vue';




</script>

<style>
    
</style>