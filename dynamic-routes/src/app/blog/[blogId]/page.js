export default async function BlogPost({ params }) {
  const { blogId } = await (params);

return (<div className="p-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4 ">Blog Post: {blogId}</h1>
      <p className="text-gray-100">
        This is the blog post page for blog ID: {blogId}. Here you can find
        detailed information and content related to this specific blog post.
      </p>
    </div>
  );

}