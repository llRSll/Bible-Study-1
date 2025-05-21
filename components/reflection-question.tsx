interface ReflectionQuestionProps {
  number: number
  question: string
}

export function ReflectionQuestion({ number, question }: ReflectionQuestionProps) {
  return (
    <div className="reflection-question">
      <div className="question-number">{number}</div>
      <p className="question-text">{question}</p>
    </div>
  )
}
