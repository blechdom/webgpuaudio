'use client'
import { useEffect, useState } from "react"

const useDevice = (): any => {
    const [adapter, setAdapter] = useState<GPUAdapter>()
    const [device, setDevice] = useState<GPUDevice>()

    useEffect(() => {
        if (navigator.gpu === undefined) return
        const initWebGPU = async () => {

            const adapter = await navigator.gpu.requestAdapter()

            if (adapter === null) return
            const device = await adapter.requestDevice()

            setAdapter(adapter)
            setDevice(device)

            device.lost.then(() => {
                setDevice(undefined)
            })
        }
        initWebGPU()
    }, [])
    if (typeof window !== "undefined") {
        return {
            adapter,
            device,
            gpu: navigator.gpu
        }
    } else return;

}

export default useDevice