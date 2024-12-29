<template>


    <div class="border-bottom text-center py-2 bg-light">
        {{selectedJobCluster?.length || 0}}筆資料

    </div>
    <div class="row row-cols-1 g-0 ">
        <div v-for="(feature) in selectedJobCluster" :key="feature.getId()">
            <div class="col">
                <div class="card border-start-0 border-end-0 border-top-0 rounded-0" @click="cardClick($event, String(feature.getId()) )">
                    <div class="card-body jobitem ">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title fs-6"><a href="#"  class="text-decoration-none fw-bold" @click="cardClick($event, String(feature.getId()) )">{{feature.get('orG_NAME')}}</a></h5>
                            <span class="text-muted">{{feature.get('datE_FROM').substring(5)}}~{{feature.get('datE_TO').substring(5)}}</span>
                        </div>
                        <h6 class="card-subtitle mb-1 text-muted">{{feature.get('sysnam')}}/{{feature.get('title')}}/{{feature.get('ranK_START')}}-{{feature.get('ranK_END')}}職等</h6>

                        <div class="card-text d-block text-truncate mb-1" :class=" {'text-danger' : feature.get('iS_XYDoubt')}" >{{feature.get('worK_ADDRESS')}}</div>
                        <!-- <a href="#" @click.stop class="card-link text-decoration-none fs-6">詳細資訊</a> -->
                        <a :href="`https://web3.dgpa.gov.tw/want03front/ap/wantf00001_1.aspx?work_id=${feature.get('vieW_URL')}`"  target="_blank" @click.stop rel="noreferrer noopener" class="card-link text-decoration-none">
                            人事行政總處
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
        
</template>

<script setup lang="ts">
    import { ref, onMounted, onUnmounted } from 'vue'
    import eventBus from '@/utils/eventBus';
    import type { Geometry } from "ol/geom";
    import Feature from 'ol/Feature';

    // 接收map點選Cluster
    const selectedJobCluster = ref<Feature<Geometry>[] | null>(null);

    // 處理接收到的數據
    const handleJobClusterSelected = (data:  Feature[]) => {
        selectedJobCluster.value = []
        selectedJobCluster.value =  data
    }

    const cardClick = (e:Event,featureId:string) =>{
        console.log(featureId)
        eventBus.emit('zoom-to-feature', featureId);
    }

    // 組件掛載時註冊事件監聽
    onMounted(() => {
        eventBus.on('map-job-select', handleJobClusterSelected)
    })
    // 組件卸載時移除事件監聽
    onUnmounted(() => {
        eventBus.off('map-job-select', handleJobClusterSelected)
    })
</script>

<style scoped>
    .jobitem:hover,
    .jobitem.active{
        background-color: #ffeedf;
        cursor: pointer;
    }

</style>