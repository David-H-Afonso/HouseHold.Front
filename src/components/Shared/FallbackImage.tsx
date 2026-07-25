import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { customFetch } from '@/utils/customFetch'
import './FallbackImage.scss'

const IMAGE_CACHE_TTL = 60 * 60 * 1000
const protectedImageCache = new Map<string, { objectUrl: string; expiresAt: number }>()
const pendingProtectedImages = new Map<string, Promise<string>>()

interface FallbackImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
	src: string | null | undefined
	fallbackSrc?: string | null
	fallbackLabel?: string
}

const isProtectedSource = (src: string | null | undefined) => src?.startsWith('/modules/') || src?.startsWith('/api/v1/')

const loadProtectedImage = (src: string) => {
	const now = Date.now()
	const cached = protectedImageCache.get(src)
	if (cached && cached.expiresAt > now) return Promise.resolve(cached.objectUrl)
	if (cached) {
		URL.revokeObjectURL(cached.objectUrl)
		protectedImageCache.delete(src)
	}
	const pending = pendingProtectedImages.get(src)
	if (pending) return pending
	const request = customFetch<Blob>(src).then((blob) => {
		const objectUrl = URL.createObjectURL(blob)
		protectedImageCache.set(src, { objectUrl, expiresAt: Date.now() + IMAGE_CACHE_TTL })
		return objectUrl
	}).finally(() => pendingProtectedImages.delete(src))
	pendingProtectedImages.set(src, request)
	return request
}

export const FallbackImage = ({ src, fallbackSrc, fallbackLabel = 'Image unavailable', className = '', alt = '', ...props }: FallbackImageProps) => {
	const [resolvedSource, setResolvedSource] = useState<string | null>(null)
	const [currentSource, setCurrentSource] = useState(isProtectedSource(src) ? null : src ?? fallbackSrc ?? null)
	const [usedFallback, setUsedFallback] = useState(!src && Boolean(fallbackSrc))
	const [failed, setFailed] = useState(!src && !fallbackSrc)

	useEffect(() => {
		let active = true
		if (isProtectedSource(src) && src) {
			setFailed(false)
			setCurrentSource(null)
			void loadProtectedImage(src).then((objectUrl) => {
				if (!active) return
				setResolvedSource(objectUrl)
				setCurrentSource(objectUrl)
				setUsedFallback(false)
			}).catch(() => {
				if (!active) return
				setCurrentSource(fallbackSrc ?? null)
				setUsedFallback(Boolean(fallbackSrc))
				setFailed(!fallbackSrc)
			})
		} else {
			setResolvedSource(null)
			setCurrentSource(src ?? fallbackSrc ?? null)
			setUsedFallback(!src && Boolean(fallbackSrc))
			setFailed(!src && !fallbackSrc)
		}
		return () => {
			active = false
		}
	}, [fallbackSrc, src])

	if (failed || !currentSource) {
		return <span className={`${className} image-fallback-state`} role='img' aria-label={alt || fallbackLabel}><span aria-hidden='true'>No image</span></span>
	}

	return <img {...props} className={className} src={currentSource ?? resolvedSource ?? undefined} alt={alt} onError={() => {
		if (!usedFallback && fallbackSrc && currentSource !== fallbackSrc) {
			setUsedFallback(true)
			setCurrentSource(fallbackSrc)
			return
		}
		setFailed(true)
	}} />
}
