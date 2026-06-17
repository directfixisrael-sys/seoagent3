import 'server-only';
import { updateArticle } from './db';
import { generateArticle, generateImage, calcSeoScore } from './generator';
import { uploadImage, publishPost } from './wordpress';

export async function runPipeline(articleId: number, keyword: string, secondaryKeywords = '') {
  try {
    await updateArticle(articleId, { status: 'generating' });

    const generated = await generateArticle(keyword, secondaryKeywords);
    const seoScore = calcSeoScore(generated, keyword);

    await updateArticle(articleId, {
      title: generated.title,
      slug: generated.slug,
      content_preview: generated.preview,
      seo_score: seoScore,
      word_count: generated.wordCount,
      image_prompt: generated.imagePrompt,
    });

    let featuredMediaId: number | null = null;
    if (generated.imagePrompt) {
      const imageUrl = await generateImage(generated.imagePrompt);
      if (imageUrl) {
        await updateArticle(articleId, { image_url: imageUrl });
        featuredMediaId = await uploadImage(imageUrl, generated.title);
      }
    }

    await updateArticle(articleId, { status: 'publishing' });

    const wpPost = await publishPost({
      title: generated.title,
      content: generated.content,
      slug: generated.slug,
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      featuredMediaId,
    });

    await updateArticle(articleId, {
      status: 'published',
      wp_post_id: wpPost.id,
      wp_url: wpPost.link,
      published_at: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateArticle(articleId, { status: 'failed', error_message: msg });
    throw err;
  }
}
