import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { customFetch } from '@/utils/customFetch'
import './FallbackImage.scss'

interface FallbackImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
	src: string | null | undefined
	fallbackSrc?: string | null
	fallbackLabel?: string
}

const isProtectedSource = (src: string | null | undefined) => src?.startsWith('/modules/') || src?.startsWith('/api/v1/')

export const FallbackImage = ({ src, fallbackSrc, fallbackLabel = 'Image unavailable', className = '', alt = '', ...props }: FallbackImageProps) => {
	const [resolvedSource, setResolvedSource] = useState<string | null>(null)
	const [currentSource, setCurrentSource] = useState(isProtectedSource(src) ? null : src ?? fallbackSrc ?? null)
	const [usedFallback, setUsedFallback] = useState(!src && Boolean(fallbackSrc))
	const [failed, setFailed] = useState(!src && !fallbackSrc)

	useEffect(() => {
		let active = true
		let objectUrl: string | null = null
		if (isProtectedSource(src) && src) {
			setFailed(false)
			setCurrentSource(null)
			void customFetch<Blob>(src).then((blob) => {
				if (!active) return
				objectUrl = URL.createObjectURL(blob)
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
			if (objectUrl) URL.revokeObjectURL(objectUrl)
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
