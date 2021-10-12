import { NextApiRequest, NextApiResponse } from 'next';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc): string {
  if (doc.type === 'postblog') {
    return `/post/${doc.uid}`;
  }

  return `/${doc.uid}`;
}

const posts = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const { token: ref, documentId } = req.query;

  const prismic = getPrismicClient(req);
  const url = await prismic
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  // const redirectUrl = await Client(req)
  //   .getPreviewResolver(ref, documentId)
  //   .resolve(linkResolver, '/');

  if (!url) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });

  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${url}" />
    <script>window.location.href = '${url}'</script>
    </head>`
  );
  return res.end();
};

export default posts;
