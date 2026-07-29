'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Star, Trash2, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type ReviewMedia = { id?: string; media_type: 'image' | 'video'; url: string };
type Review = {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  media: ReviewMedia[];
  created_at?: string;
};

type ReviewsPayload = {
  avg_rating: number;
  review_count: number;
  items: Review[];
};

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;

function Stars({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: 'sm' | 'md';
}) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className={`${cls} ${n <= value ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-ink-muted'}`}
          />
        </button>
      ))}
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function ProductReviews({
  productId,
  avgRating,
  reviewCount,
  onSummaryChange,
}: {
  productId: string;
  avgRating?: number;
  reviewCount?: number;
  onSummaryChange?: (avg: number, count: number) => void;
}) {
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<ReviewsPayload>({
    avg_rating: avgRating || 0,
    review_count: reviewCount || 0,
    items: [],
  });

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [media, setMedia] = useState<ReviewMedia[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.getProductReviews(productId);
      setData(res);
      onSummaryChange?.(res.avg_rating, res.review_count);
      if (user) {
        const mine = (res.items || []).find((r: Review) => r.user_id === user.id);
        if (mine) {
          setRating(mine.rating);
          setTitle(mine.title || '');
          setComment(mine.comment || '');
          setMedia(mine.media || []);
        }
      }
    } catch {
      setData({ avg_rating: avgRating || 0, review_count: reviewCount || 0, items: [] });
    } finally {
      setLoading(false);
    }
  }, [productId, user, avgRating, reviewCount, onSummaryChange]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const imageCount = media.filter((m) => m.media_type === 'image').length;
  const videoCount = media.filter((m) => m.media_type === 'video').length;

  async function onPickFiles(files: FileList | null, kind: 'image' | 'video') {
    if (!files?.length) return;
    if (!user) {
      toast.error('Please log in to upload media');
      return;
    }
    const list = Array.from(files);
    if (kind === 'image' && imageCount + list.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images`);
      return;
    }
    if (kind === 'video') {
      if (videoCount >= MAX_VIDEOS) {
        toast.error('Only 1 video allowed');
        return;
      }
    }
    setUploading(true);
    try {
      const uploaded: ReviewMedia[] = [];
      for (const file of list.slice(0, kind === 'image' ? MAX_IMAGES - imageCount : 1)) {
        const res = await api.uploadReviewMedia(file);
        uploaded.push({ media_type: res.media_type, url: res.url });
      }
      setMedia((prev) => {
        if (kind === 'video') {
          return [...prev.filter((m) => m.media_type !== 'video'), ...uploaded];
        }
        return [...prev, ...uploaded].slice(0, MAX_IMAGES + MAX_VIDEOS);
      });
      toast.success('Media uploaded');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  }

  function removeMedia(url: string) {
    setMedia((prev) => prev.filter((m) => m.url !== url));
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to write a review');
      return;
    }
    if (!comment.trim() && !title.trim() && media.length === 0) {
      toast.error('Add a comment, title, or media');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitProductReview(productId, {
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        media: media.map((m) => ({ media_type: m.media_type, url: m.url })),
      });
      toast.success('Review submitted');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-4 bg-white p-4 shadow-sm lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Ratings & reviews</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {data.review_count
              ? `${data.review_count} review${data.review_count === 1 ? '' : 's'}`
              : 'No reviews yet — be the first'}
          </p>
        </div>
        {data.review_count > 0 ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-sm bg-green px-2.5 py-1 text-base font-bold text-white">
              {data.avg_rating.toFixed(1)} <Star className="h-4 w-4 fill-white" />
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
        <form onSubmit={submitReview} className="space-y-4 border border-line bg-[#f9fafb] p-4">
          <p className="text-sm font-semibold text-ink">
            {user ? 'Write a review' : 'Sign in to review'}
          </p>
          {!user ? (
            <p className="text-sm text-ink-muted">
              <Link href={`/login?next=/shop/${productId}`} className="font-semibold text-primary">
                Log in
              </Link>{' '}
              as an active member to rate this product.
            </p>
          ) : (
            <>
              <div>
                <p className="mb-1 text-xs font-medium text-ink-muted">Your rating</p>
                <Stars value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="review-title">
                  Title (optional)
                </label>
                <input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="review-comment">
                  Comment
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={5000}
                  rows={4}
                  className="w-full resize-y border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Share what you liked or what could be better"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-ink-muted">
                  Photos (up to {MAX_IMAGES}) · Video (up to {MAX_VIDEOS})
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading || imageCount >= MAX_IMAGES}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-1.5 h-4 w-4" />
                    Add photos
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading || videoCount >= MAX_VIDEOS}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="mr-1.5 h-4 w-4" />
                    Add video
                  </Button>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files, 'image')}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files, 'video')}
                />
                {media.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {media.map((m) => (
                      <div key={m.url} className="relative h-16 w-16 overflow-hidden border border-line bg-white">
                        {m.media_type === 'video' ? (
                          <video src={m.url} className="h-full w-full object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.url} alt="" className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(m.url)}
                          className="absolute right-0.5 top-0.5 rounded bg-ink/80 p-0.5 text-white"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {uploading ? <p className="mt-2 text-xs text-ink-muted">Uploading…</p> : null}
              </div>
              <Button type="submit" loading={submitting} disabled={uploading} className="w-full">
                Submit review
              </Button>
              <p className="text-[11px] text-ink-muted">One review per product — submitting again updates yours.</p>
            </>
          )}
        </form>

        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : data.items.length === 0 ? (
            <p className="py-8 text-sm text-ink-muted">No customer reviews yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.items.map((r) => (
                <li key={r.id} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 rounded-sm bg-green px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {r.rating} <Star className="h-3 w-3 fill-white" />
                    </span>
                    {r.title ? <p className="text-sm font-semibold text-ink">{r.title}</p> : null}
                  </div>
                  {r.comment ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{r.comment}</p>
                  ) : null}
                  {r.media?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.media.map((m) =>
                        m.media_type === 'video' ? (
                          <video
                            key={m.url}
                            src={m.url}
                            controls
                            className="max-h-40 max-w-[220px] rounded border border-line bg-black"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={m.url}
                            src={m.url}
                            alt=""
                            className="h-24 w-24 rounded border border-line object-cover"
                          />
                        )
                      )}
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs text-ink-muted">
                    {r.user_name}
                    {r.created_at ? ` · ${formatDate(r.created_at)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
