'use client';

import { useState } from 'react';

export default function Home() {
  const [newsUrl, setNewsUrl] = useState('');
  const [customText, setCustomText] = useState('');
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateVideo = async () => {
    if (!newsUrl && !customText) {
      setStatus('Please provide either a news URL or custom text');
      return;
    }

    setIsLoading(true);
    setStatus('Generating video...');
    setVideoUrl('');

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsUrl: newsUrl || undefined,
          customText: customText || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setVideoUrl(data.videoData);
      setStatus('Video generated successfully!');
    } catch (error) {
      setStatus(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = () => {
    if (isLoading) return 'status loading';
    if (status.includes('successfully')) return 'status success';
    if (status.includes('Failed') || status.includes('Error')) return 'status error';
    return 'status';
  };

  return (
    <div className="container">
      <main className="main">
        <h1>📰 News Video Maker</h1>
        <p className="subtitle">Transform news articles into engaging videos</p>

        <div className="input-section">
          <label htmlFor="newsUrl">News Article URL (optional)</label>
          <input
            id="newsUrl"
            type="text"
            placeholder="https://example.com/news-article"
            value={newsUrl}
            onChange={(e) => setNewsUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="input-section">
          <label htmlFor="customText">Or Enter Custom News Text</label>
          <textarea
            id="customText"
            placeholder="Breaking news: Scientists discover..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          className="button"
          onClick={generateVideo}
          disabled={isLoading || (!newsUrl && !customText)}
        >
          {isLoading ? 'Generating...' : 'Generate Video'}
        </button>

        {status && <div className={getStatusClass()}>{status}</div>}

        {videoUrl && (
          <div className="preview-section">
            <h2>Your Video</h2>
            <div className="video-container">
              <iframe
                src={videoUrl}
                style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }}
                title="News Video"
              />
            </div>
          </div>
        )}

        <div className="examples">
          <h3>How it works:</h3>
          <ul>
            <li>Enter a news article URL to fetch and render the content</li>
            <li>Or write your own custom news text</li>
            <li>The app generates an animated video with text overlays</li>
            <li>Download and share your video</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
