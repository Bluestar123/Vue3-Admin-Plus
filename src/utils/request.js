/*
 * Copyright (c) 2021
 * 项目名称：Vue3-Admin-Plus
 * 文件名称：request.js
 * 创建日期：2021/1/26 下午5:49
 * 创建作者：Jaxson
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { setToken } from '@/utils/auth'
import store from '@/store'

export const request = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/jy-service' : window.VUE_APP.VUE_APP_BASE_API + window.VUE_APP.VUE_APP_URI,
  withCredentials: false,
  timeout: 10 * 1000
})

request.interceptors.request.use(config => {
  if (store.getters.token) {
    config.headers = {
      Authorization: 'Bearer ' + store.getters.token
    }
  }
  return config
}, error => {
  return Promise.reject(error)
})

request.interceptors.response.use(response => {
  const { data } = response
  if (data.code !== '0000') {
    ElMessage({
      message: data.msg || 'Error',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(new Error(data.msg || 'Error'))
  } else {
    // 判断 token 是否存在，如果存在说明后台系统推送新的 token 信息
    // 需要替换 cookie 里的 token
    if (data.authorization) setToken(data.authorization)
    return data.data
  }
}, async(error) => {
  const { response } = error
  let data = '未知错误'
  if (response !== undefined) {
    switch (response.data.code) {
      case 401:
        data = '用户 token 已失效，请重新登录！'
        ElMessage({
          message: data,
          type: 'error',
          duration: 5 * 1000
        })
        // 触发触发器并重定向到登录页
        await store.dispatch('user/resetToken')
        await useRouter().push(`/login?redirect=${useRoute().path}`)
        break
      default:
        ElMessage({
          message: response.data.msg,
          type: 'error',
          duration: 5 * 1000
        })
        data = response.data.msg
    }
  } else {
    ElMessage({
      message: '网络异常',
      type: 'error',
      duration: 5 * 1000
    })
    data = '网络异常'
  }
  return Promise.reject(data)
})
