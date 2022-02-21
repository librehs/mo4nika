import { useEffect, useRef, useState } from 'react'

const TelegramIframe = ({ username, id }: { username: string; id: number }) => {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(1500)

  const postMessageHandler = (event: any) => {
    if (!frame.current || event.source !== frame.current.contentWindow) {
      return
    }

    let data
    try {
      data = JSON.parse(event.data)
    } catch (e) {
      return
    }
    if (data.event === 'resize') {
      if (data.height) {
        setHeight(data.height)
      }
    }
  }

  useEffect(() => {
    window.addEventListener('message', postMessageHandler)
  })

  return (
    <iframe
      src={`https://t.me/${username}/${id}?embed=1`}
      scrolling="no"
      width="100%"
      height={height}
      frameBorder="0"
      ref={frame}
    ></iframe>
  )
}

export default TelegramIframe
