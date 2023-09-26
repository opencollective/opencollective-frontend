import clsx from 'clsx';
import React from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/TextArea';
import ReactAnimateHeight from 'react-animate-height';

export default function Survey({ question, id }) {
  const [selectedScore, setScore] = React.useState(null);
  const showForm = selectedScore !== null;
  return (
    <div className="flex flex-col gap-4">
      <p>{question}</p>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          {/* ['😫', '😕', '😐', '🙂', '😀'] */}
          {/* [0, 1, 2, 3, 4, 5] */}
          {['😫', '😕', '😐', '🙂', '😀'].map(score => (
            <Button
              key={score}
              size="icon"
              variant={score === selectedScore ? 'default' : 'outline'}
              onClick={e => {
                e.preventDefault();
                console.log('click');
                setScore(score);
              }}
              className="text-xl"
              // className={clsx(score === selectedScore && 'ring-2 ring-ring ring-offset-2')}
            >
              {score}
            </Button>
          ))}
        </div>
        <div className="flex justify-between text-muted-foreground">
          <p>Not great</p>
          <p>Great</p>
        </div>
      </div>

      <ReactAnimateHeight duration={150} height={showForm ? 'auto' : 0}>
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">Thanks! What did you like about it? What could be improved?</p>
          <Textarea />
          <div>
            <Button>Submit</Button>
            <Button variant="ghost">Close</Button>
          </div>
        </div>
      </ReactAnimateHeight>
    </div>
  );
}
