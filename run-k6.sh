#!/bin/bash

kubectl apply -f ./k6/k6-configmap.yaml -n web-apps
kubectl delete job k6-load-test -n web-apps --ignore-not-found=true
kubectl apply -f ./k6/k6-job.yaml -n web-apps
echo "실시간 결과: kubectl logs -f job/k6-load-test -n web-apps"
