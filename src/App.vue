<template>
    <!-- html -->

    <div class="container-fluid g-0">
        <div class="fixed-top">
            <Header style=" z-index : 1100"></Header>
        </div>
        <div class="row-cols-1 row-cols-lg-12 gx-0 position-relative d-flex flex-lg-row flex-column" style="padding-top: 55px;">
            <div class="col-lg-9 position-fixed p-0 m-0" style="position:absolute; top: 0;">
                <Map></Map>
            </div>
            <div class="col-lg-3 ms-lg-auto p-0 m-0 bottomsheet">
                <div class="h-100 overflow-y-auto">
                    <Side></Side>
                </div>
            </div>
        </div>
    </div>

</template>



<script setup lang="ts" name="App">
    import Header from './views/Header.vue';
    import Map from './views/Map.vue';
    import Side from './views/Side.vue';



</script>

<style scoped>

    @media only screen and (max-width: 991px) {
        .overflow-y-auto {
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
        }
        .bottomsheet{
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
            max-height: 35vh;
            overflow-y: scroll;
        }

    }

</style>