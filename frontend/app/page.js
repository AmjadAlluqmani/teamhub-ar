export default function Page(){
  return (
    <section className="py-16">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-extrabold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          نبني المستقبل بالتعاون والإبداع
        </h1>
        <p className="text-lg text-gray-600">منصة تعرض مشاريعنا وتسهّل تعاوننا.</p>
        <div className="flex gap-4 justify-center">
          <a href="/projects" className="btn">استعرض مشاريعنا</a>
          <a href="/about" className="px-4 py-2 rounded-xl border">تعرفي على الفريق</a>
        </div>
      </div>
    </section>
  )
}
