import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FrameData {
  text: string;
  duration: number;
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function generateVideoHTML(frames: FrameData[]): string {
  const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);

  let animations = '';
  let currentTime = 0;

  frames.forEach((frame, index) => {
    const startPercent = (currentTime / totalDuration) * 100;
    const endPercent = ((currentTime + frame.duration) / totalDuration) * 100;

    animations += `
      .frame-${index} {
        animation: fadeInOut-${index} ${totalDuration}s linear infinite;
      }

      @keyframes fadeInOut-${index} {
        0%, ${startPercent - 0.1}% {
          opacity: 0;
          transform: translateY(20px);
        }
        ${startPercent}% {
          opacity: 1;
          transform: translateY(0);
        }
        ${endPercent - 0.1}% {
          opacity: 1;
          transform: translateY(0);
        }
        ${endPercent}%, 100% {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
    `;

    currentTime += frame.duration;
  });

  const frameHTML = frames.map((frame, index) => {
    const lines = wrapText(frame.text, 50);
    return `
      <div class="frame frame-${index}">
        ${lines.map(line => `<div class="line">${line}</div>`).join('')}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          width: 1920px;
          height: 1080px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
          overflow: hidden;
        }

        .container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .frame {
          position: absolute;
          text-align: center;
          color: white;
          font-size: 72px;
          font-weight: bold;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
          padding: 60px;
          max-width: 90%;
          opacity: 0;
        }

        .line {
          margin: 20px 0;
        }

        ${animations}
      </style>
    </head>
    <body>
      <div class="container">
        ${frameHTML}
      </div>
    </body>
    </html>
  `;
}

async function fetchNewsContent(url: string): Promise<string> {
  try {
    const axios = (await import('axios')).default;
    const cheerio = await import('cheerio');

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    $('script, style, nav, header, footer, iframe, .ad, .advertisement').remove();

    let content = '';

    const title = $('h1').first().text().trim();
    if (title) {
      content += title + '. ';
    }

    $('article p, .article p, .content p, main p, p').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 30) {
        content += text + ' ';
      }
    });

    if (!content) {
      content = $('body').text().trim();
    }

    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 1000);

    return content || 'Unable to extract meaningful content from the URL.';
  } catch (error) {
    throw new Error(`Failed to fetch news content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function createFrames(text: string): FrameData[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  const frames: FrameData[] = sentences.slice(0, 10).map((sentence) => ({
    text: sentence.trim(),
    duration: 3,
  }));

  if (frames.length === 0) {
    frames.push({ text: text.substring(0, 200), duration: 5 });
  }

  return frames;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsUrl, customText } = body;

    let content = '';

    if (newsUrl) {
      content = await fetchNewsContent(newsUrl);
    } else if (customText) {
      content = customText;
    } else {
      return NextResponse.json(
        { error: 'Please provide either newsUrl or customText' },
        { status: 400 }
      );
    }

    const frames = createFrames(content);
    const html = generateVideoHTML(frames);

    const videoData = `data:text/html;base64,${Buffer.from(html).toString('base64')}`;

    return NextResponse.json({ videoData });

  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate video' },
      { status: 500 }
    );
  }
}
