import { NextApiRequest, NextApiResponse } from 'next';

const posts = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};

export default posts;
