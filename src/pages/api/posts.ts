import { NextApiRequest, NextApiResponse } from 'next';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

const posts = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const { page } = req.query;
  const prismic = getPrismicClient(req);

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'postblog')],
    {
      fetch: ['postblog.title', 'postblog.subtitle', 'postblog.author'],
      pageSize: 1,
      page,
    }
  );
  return res.status(200).json({ ...postsResponse });
};

export default posts;
