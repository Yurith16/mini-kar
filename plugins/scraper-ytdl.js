// plugins/scraper-ytdl.js
import yts from 'yt-search';

const ytdl = async (videoUrl, formato) => {
  if (!formato) throw new Error('Formato requerido (mp4 o mp3)');
  
  // Si NO es URL, buscar en YouTube
  if (!videoUrl.includes('youtu.be') && !videoUrl.includes('youtube.com')) {
    const search = await yts(videoUrl);
    if (!search.videos.length) throw new Error('No se encontraron resultados');
    videoUrl = search.videos[0].url;
  }
  
  const base = 'https://yt.shiru.qzz.io';
  const path = '/api/video/info';
  
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: videoUrl, format: formato })
  });

  const videoInfo = await response.json();
  if (videoInfo.error) throw new Error(videoInfo.error);
  
  const downloadId = videoInfo.download_id;
  
  while (true) {
    const progressRes = await fetch(`${base}/progress/${downloadId}`);
    const status = await progressRes.json();
    
    if (status.progress === 'dl') {
      return {
        ...videoInfo,
        download_url: `${base}${status.download_url}`,
        download_status: 'ready'
      };
    }
    
    if (status.progress === 'error') throw new Error('Error en la descarga');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
};

export default ytdl;