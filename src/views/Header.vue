<template>
<div class="">
    <nav class="px-3 navbar navbar-expand-lg navbar-dark bg-dark">


        <a class="navbar-brand" href="#">
            事求人開放資料地圖
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent" >
            <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="cityDropdown" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                        工作地
                    </a>
                    <ul class="dropdown-menu scrolly" aria-labelledby="cityDropdown">
                        <li v-for="[city, count] of cityHash" :key="city">
                            <a class="dropdown-item dropitem" href="#" @click="cityClicked($event,city)">{{city}}({{count}})</a>
                        </li>
                    </ul>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="normalDropdown" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                        行政類
                    </a>
                    <ul class="dropdown-menu scrolly" aria-labelledby="normalDropdown">
                        <li v-for="[sysName, count] of normalSysHash" :key="sysName" >
                            <a class="dropdown-item dropitem" href="#" @click="sysNameClicked($event,sysName)">{{sysName}}({{count}})</a>
                        </li>
                    </ul>
                </li>
                <li class="nav-item dropdown ">
                    <a class="nav-link dropdown-toggle" href="#" id="techDropdown" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                    技術類
                    </a>
                    <ul class="dropdown-menu scrolly" aria-labelledby="techDropdown">
                        <li v-for="[sysName, count] of techSysHash" :key="sysName">
                            <a class="dropdown-item dropitem" href="#" @click="sysNameClicked($event,sysName)">{{sysName}}({{count}})</a>
                        </li>
                    </ul>
                </li>
            </ul>
            <div class="d-flex align-items-center justify-content-between">
                <a href="#" class="btn btn-outline-secondary me-2">關於</a>
                <div class="me-2 text-light">
                    {{ updateDate }}
                </div>
            </div>
        </div>


        
    </nav>
</div>

    
</template>

<script setup lang="ts">
    import { ref, onMounted, onUnmounted } from 'vue'
    import eventBus from '@/utils/eventBus';
    import { Feature } from 'ol';
    import { normalSysSet } from '@/utils/sysNameSet';
    import axios from 'axios';

    // https://dgpamapwebapiapi2.azure-api.net/UpdateDate


    // 定義API的URL
    const apiUrl = 'https://dgpamapwebapiapi2.azure-api.net/UpdateDate';
    const updateDate = ref()
    // 使用axios發送GET請求
    axios.get(apiUrl)
    .then(response => {
        // 處理成功的回應
        // console.log('回應數據:', response.data);
        updateDate.value = `資料時間:${response.data}`
    })
    .catch(error => {
        // 處理錯誤
        console.error('發生錯誤:', error);
    });


    const cityHash = ref(new Map())
    const normalSysHash = ref(new Map())
    const techSysHash = ref(new Map())
    
    // 接收map傳來Job數據
    const jobFeatureArray = ref<Feature[] | null>(null);
    const handleJobFeatureLoaded = (data:  Feature[]) => {
        jobFeatureArray.value =  data
        // JobArray分類:工作縣市,行政技術職系
        for (let feature of jobFeatureArray.value) {
            let city = feature.get('worK_PLACE_TYPE')
            
            if (cityHash.value.has(city)) {
                cityHash.value.set(city, cityHash.value.get(city) + 1);
            } else {
                cityHash.value.set(city, 1);
            }

            let sysName = feature.get('sysnam')
            if (normalSysSet.has(sysName)) {
                //行政職系
                normalSysHash.value.set(sysName, (normalSysHash.value.get(sysName) || 0) + 1);
            } else {
                //技術職系
                techSysHash.value.set(sysName, (techSysHash.value.get(sysName) || 0) + 1);
            }
        }
    }

    const cityClicked = (e : Event,cityName:string) => {
        e.preventDefault();
        const target = e.target as HTMLElement;; // 獲取點擊的 DOM 元素
        target?.classList.toggle('active'); // 切換 active class
        // console.log(cityName);
        eventBus.emit('city-filter-updated', cityName);
    }

    const sysNameClicked = (e : Event,sysName:string) => {
        e.preventDefault();
        const target = e.target as HTMLElement; // 獲取點擊的 DOM 元素
        target?.classList.toggle('active'); // 切換 active class
        eventBus.emit('sysName-filter-updated', sysName);
    }


    // 組件掛載時註冊事件監聽
    onMounted(() => {
        eventBus.on('job-loaded-updated', handleJobFeatureLoaded)
    })
    // 組件卸載時移除事件監聽
    onUnmounted(() => {
        eventBus.off('job-loaded-updated', handleJobFeatureLoaded)
    })
</script>

<style scoped>
    .dropitem{
        font-size: 0.95rem;
    }
    .scrolly{
        scrollbar-width: thin;
        scrollbar-color: #888 #f1f1f1;
        overflow-y: scroll;
        max-height: 65vh;
    }

</style>