import { ObjectDetail } from '@/views/object-detail';

export default async function ObjectPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <ObjectDetail slug={slug} />; }

