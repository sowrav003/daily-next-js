// export default async function Page({ params }) {
//   const { slug } = await params;

//   return (
//     <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-green-50 via-white to-blue-50 px-6 text-center">
//       <h1 className="text-5xl font-extrabold tracking-tight text-green-600 sm:text-6xl">
//         Blog Post {slug}
//       </h1>

//       <p className="mt-4 text-xl text-gray-500">
//         This is the content of the blog post with slug: {slug}
//       </p>
//     </div>
//   );
// }


export async function generateMetadata({ params }) {
  const slug = (await params).slug
  return {
    title: `Blog Post ${slug}`,
    description: `This is the content of the blog post with slug: ${slug}`,
  }
}
 
export default function Page({ params }) {
  const slug = params.slug
 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-green-50 via-white to-blue-50 px-6 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-green-600 sm:text-6xl">
        Blog Post {slug}
      </h1>
      </div>
  )
}