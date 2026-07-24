import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import './FallbackImage.scss'

interface FallbackImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
	src: string | null | undefined
	fallbackSrc?: string | null
	fallbackLabel?: string
}

export const FallbackImage = ({ src, fallbackSrc, fallbackLabel = 'Image unavailable', className = '', alt = '', ...props }: FallbackImageProps) => {
	const [currentSource, setCurrentSource] = useState(src ?? fallbackSrc ?? null)
	const [usedFallback, setUsedFallback] = useState(!src && Boolean(fallbackSrc))
	const [failed, setFailed] = useState(!src && !fallbackSrc)

	useEffect(() => {
		setCurrentSource(src ?? fallbackSrc ?? null)
		setUsedFallback(!src && Boolean(fallbackSrc))
		setFailed(!src && !fallbackSrc)
	}, [fallbackSrc, src])

	if (failed || !currentSource) {
		return <span className={`${className} image-fallback-state`} role='img' aria-label={alt || fallbackLabel}><span aria-hidden='true'>No image</span></span>
	}

	return <img {...props} className={className} src={currentSource} alt={alt} onError={() => {
		if (!usedFallback && fallbackSrc && currentSource !== fallbackSrc) {
			setUsedFallback(true)
			setCurrentSource(fallbackSrc)
			return
		}
		setFailed(true)
	}} />
}
