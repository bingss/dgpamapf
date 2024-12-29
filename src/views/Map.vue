
<template>


  <div class="spinner-border align-center loading" v-if="isLoading" >
    <span class="visually-hidden">Loading...</span>
  </div>

  <ol-map
    ref="map"
    :controls="[]"
    :class="{ 'cursor-pointer': isOnPoint }"
    class="vh-100 ">

    <!-- <ol-view
      ref="view"
      :center="center"
      :rotation="rotation"
      :zoom="zoom"
      :projection="projection"
      @change:center="centerChanged"
      @change:resolution="resolutionChanged"
      @change:rotation="rotationChanged"/>  -->
      <ol-view
        ref="view"
        :center="center"
        :rotation="rotation"
        :zoom="zoom"
        :projection="projection"/> 
      <!-- WMTS底圖:台灣通用電子地圖 -->
      <ol-tile-layer>
        <ol-source-wmts
          :attributions="wmtsAttribution"
          :url="wmtsUrl"
          :matrixSet="wmtsMatrixSet"
          :format="wmtsFormat"
          :layer="wmtsLayerName"
          :styles="wmtsStyleName"
        ></ol-source-wmts>
      </ol-tile-layer>

      <!-- Cluster點選設定 -->
      <ol-interaction-clusterselect
        @select="clusterClicked"
        :condition="clickCondition"
        :pointRadius="20"
        :featureStyle="noStyle">
        <ol-style :overrideStyleFunction="pointClickedStyleFn"></ol-style>
      </ol-interaction-clusterselect>


      <!-- Cluster滑鼠hover設定-->
      <ol-interaction-clusterselect
        @select="featureHovered"
        :condition="hoverdCondition"
        :pointRadius="20"
        :featureStyle="noStyle">
        <ol-style :overrideStyleFunction="pointHoveredStyleFn"></ol-style>
      </ol-interaction-clusterselect>

      <!-- JOB:GeoJSON圖層 -->
      <ol-vector-layer>
        <ol-source-cluster
          ref="jobClusterSource"
          :distance="clusterDistance"
          :geometry-function="clusterGeometryFunction">
          <ol-source-vector 
            ref="jobVectorSource"
            :url="geojsonUrl"
            :format="geoJson"
            @featuresloadend="onFeaturesLoadEnd">
          </ol-source-vector>
          <ol-style :overrideStyleFunction="pointStyleFn"></ol-style>
        </ol-source-cluster>
      </ol-vector-layer>

      <ol-rotate-control/>
      <ol-attribution-control />
      <ol-interaction-link />

    </ol-map>

<!--  <ul style="position:absolute; bottom: 0;">
    <li>center : {{ currentCenter }}</li>
    <li>resolution : {{ currentResolution }}</li>
    <li>zoom : {{ currentZoom }}</li>
    <li>rotation : {{ currentRotation }}</li>
  </ul>-->
</template>

<script setup lang="ts">
    import { Circle, Fill, Stroke, Style,Text } from "ol/style";
    import { GeoJSON } from "ol/format";
    import { SelectEvent } from 'ol/interaction/Select';
    import { ref, inject, onMounted, onUnmounted } from "vue";
    import {View} from 'ol';
    import Feature from 'ol/Feature';
    import { VectorSourceEvent } from 'ol/source/Vector';
    import eventBus from '@/utils/eventBus'

    //地圖基本設定
    const center = ref([121, 23.5]);
    const projection = ref("EPSG:4326");
    const zoom = ref(8);
    const rotation = ref(0);
    
    //WMTS地圖
    const opacity = ref(1);
    // const geojsonUrl = ref("http://localhost:3000/0");
    const geojsonUrl = ref("https://dgpamapwebapiapi2.azure-api.net/Job/geo");
    const geoJson = new GeoJSON();
    const clusterDistance = ref(20)
    const wmtsUrl = ref("https://wmts.nlsc.gov.tw/wmts");
    const wmtsLayerName = ref("EMAP");
    const wmtsMatrixSet = ref("GoogleMapsCompatible");
    const wmtsFormat = ref("image/jpeg");
    const wmtsStyleName = ref("default");
    const wmtsAttribution = ref(
      '圖資來源 © <a href="https://maps.nlsc.gov.tw/S09SOA/homePage.action?Language=ZH" target="_blank" rel="noreferrer noopener">NLSC</a>',
    );

    //style設定
    const circleSize = 15
    const orangeFill = new Fill({
      color: 'rgba(255, 153, 0, 1)',
    });
    const whiteFill = new Fill({
      color: '#fff',
    });
    const circleStroke = new Stroke({
      color: 'rgba(255, 204, 0, 1)',
      width: 1.5,
    });
    const textStroke = new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 2,
    });

    const hoveredCircleFill = new Fill({
      color: '#ffeedf',// '#ffefdf',
    });
    const hoveredTextFill = new Fill({
      color: 'rgba(255, 153, 0, 1)',
    });


    // 創建樣式函式
    const createClusterStyle = (options: {
      circleFill: Fill,
      textFill: Fill,
      feature: Feature
    }) => {
      const { circleFill, textFill, feature } = options;
      if (!feature.get('features')) return null;
      const clusteredFeatures = feature.get("features");
      const size = clusteredFeatures.length;

      const hasSelectedFeature = clusteredFeatures.some((f: Feature) => 
        selectedFeatureIds.value.has(f.getId())
      );
      
      //若無則依傳入參數
      return new Style({
        image: new Circle({
          radius: circleSize,
          fill: hasSelectedFeature ? whiteFill : circleFill,
          stroke: circleStroke,
        }),
        zIndex: Infinity,
        text: new Text({
          text: size.toString(),
          fill: hasSelectedFeature ? orangeFill : textFill,
          stroke: textStroke,
        }),
      });
    };

    const pointStyleFn = (feature: Feature) => createClusterStyle({
      circleFill: orangeFill,
      textFill: whiteFill,
      feature
    });

    const pointHoveredStyleFn = (feature: Feature) => createClusterStyle({
      circleFill: hoveredCircleFill,
      textFill: hoveredTextFill,
      feature
    });

    const pointClickedStyleFn = (feature: Feature) => createClusterStyle({
      circleFill: whiteFill,
      textFill: orangeFill,
      feature
    });
    const noStyle = () =>{ return new Style();}


    
    let allFeatures : Feature[] = [];
    let sideComponentFeatures : Feature[] = []; //傳給Side組件顯示用
    const selectedFeatureIds = ref(new Set()); //判別Cluster是否要使用選取Style

    //處理Cluster點選事件
    const selectConditions = inject("ol-selectconditions");
    const clickCondition = selectConditions.click;
    const clusterClicked = (event : SelectEvent) => {
      const selected = event.selected[0];
      if (selected) {
        // 更新選取Ids => 更新hasSelectedFeature =>更新style
        selectedFeatureIds.value = new Set(
          selected.get('features').map( (f:Feature) => f.getId())
        );

        sideComponentFeatures = []
        sideComponentFeatures = selected.get('features');
        eventBus.emit('map-job-select', sideComponentFeatures);
        
      }
      else {
        selectedFeatureIds.value.clear();
        // sideComponentFeatures = []
        // eventBus.emit('map-job-select', sideComponentFeatures);
      }
      
      
    };

    // 處理Cluster滑鼠hover事件
    const hoverConditions = inject("ol-selectconditions");
    const hoverdCondition = hoverConditions.pointerMove;
    const isOnPoint = ref(false);
    const featureHovered = (event : SelectEvent) => {
      isOnPoint.value = event.selected[0] ? true : false;
    };

    // 符合篩選feature條件才顯示
    const cityFilter = new Set()
    const sysNameFilter = new Set()
    const handleCityFilterUpdated = (cityName:  string) => {
        if(cityFilter.has(cityName)){
            cityFilter.delete(cityName)
        }
        else{
            cityFilter.add(cityName)
        }
        refreshSideByFilter()
        refreshCluster();
    }
    const handleSysNameFilterUpdated = (sysName:  string) => {
        if(sysNameFilter.has(sysName)){
          sysNameFilter.delete(sysName)
        }
        else{
          sysNameFilter.add(sysName)
        }
        refreshSideByFilter()
        refreshCluster();
    }

    const refreshSideByFilter = () => {
        sideComponentFeatures = []
        sideComponentFeatures = allFeatures.filter(( f:Feature) => 
              ( cityFilter.has( f.get('worK_PLACE_TYPE') ) || cityFilter.size == 0 )
              && ( sysNameFilter.has( f.get('sysnam') ) || sysNameFilter.size == 0)
        );
        // console.log(sideComponentFeatures)
        eventBus.emit('map-job-select', sideComponentFeatures);
    }

    //手動觸發刷新圖徵
    const jobClusterSource = ref();
    const refreshCluster = () => {
      if (jobClusterSource.value) {
        jobClusterSource.value.source.refresh()
      }
    }

    //手動或自動刷新圖徵時觸發
    const clusterGeometryFunction = (feature:Feature) => {
      const geometry = feature.getGeometry()
      // const properties = feature.getProperties()
      if ( !cityFilter.has( feature.get('worK_PLACE_TYPE') ) && cityFilter.size > 0) {
        return null
      }
      if ( !sysNameFilter.has( feature.get('sysnam') ) && sysNameFilter.size > 0 ) {
        return null
      }
      
      return geometry
    }

    // 第一次載入或刷新圖資觸發，載入完畢後傳送至Header組件
    const isLoading = ref(true)
    const onFeaturesLoadEnd = (event : VectorSourceEvent ) => {
        allFeatures = event.target.getFeatures()
        sideComponentFeatures = allFeatures;
        isLoading.value = false;
        //載入完畢後傳送至Header組件
        eventBus.emit('job-loaded-updated', allFeatures);
        //載入完畢後傳送至Side組件
        eventBus.emit('map-job-select', allFeatures);

    };

    //Side點選事件Zoom到該Feature
    const view = ref<View | null>(null);
    const handleZoomToFeature = (featureId:string) => {
      if (view.value) {
        const frature = allFeatures.find((f) => f.getId() === featureId);
        if(frature){
          view.value.setCenter([frature?.get('coordinate_Y'), frature?.get('coordinate_X')]); // 設置中心點
          view.value.setZoom(19); // 設置縮放級別
        }
      }
    }

    // const currentCenter = ref(center.value);
    // const currentZoom = ref(zoom.value);
    // const currentRotation = ref(rotation.value);
    // const currentResolution = ref(0);
    // function resolutionChanged(event: MapEvent) {
    //   currentResolution.value = event.target.getResolution();
    //   currentZoom.value = event.target.getZoom();
    // }
    // function centerChanged(event: MapEvent) {
    //   currentCenter.value = event.target.getCenter();
    // }
    // function rotationChanged(event: MapEvent) {
    //   currentRotation.value = event.target.getRotation();
    // }


    // 組件掛載時註冊事件監聽
    onMounted(() => {
        eventBus.on('city-filter-updated', handleCityFilterUpdated)
        eventBus.on('sysName-filter-updated', handleSysNameFilterUpdated)
        eventBus.on('zoom-to-feature', handleZoomToFeature)
    })
    // 組件卸載時移除事件監聽
    onUnmounted(() => {
        eventBus.off('city-filter-updated', handleCityFilterUpdated)
        eventBus.off('sysName-filter-updated', handleSysNameFilterUpdated)
        eventBus.off('zoom-to-feature', handleZoomToFeature)
    })

</script>


<style scoped>
  @import "vue3-openlayers/styles.css";
  /* .ol-map {
    position: relative;
  } */
  .cursor-pointer {
    position: relative;
    cursor: pointer;
  }
  /* 地圖載入進度條 */
  .loading {
    position: absolute;
    top: 50%;
    left: 50%;
    /* width: 80px;
    height: 80px; */
    margin-top: -40px;
    margin-left: -40px;
    z-index:1080
  } 

</style>