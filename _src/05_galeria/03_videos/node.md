---
id: "videos"
title: "videos"
"language": true
"filters": {"CODSUBTIPOCONT": 441, "CODAREAS": 16}
"limit": 10
---
<app-tab-bar></app-tab-bar>
<app-paginator-browser>
    <div flex="100" ng-class="{'end': $last}" ng-repeat="card in elements()">
        <app-card-simple item="card" prefix="node.href"></app-card-simple>
    </div>
</app-paginator-browser>
