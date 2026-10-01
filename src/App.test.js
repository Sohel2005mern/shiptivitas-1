import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Board from './Board';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders Shipping Requests board with 3 swimlanes', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Board />, div);

  const columns = div.querySelectorAll('.Swimlane-column');
  expect(columns.length).toBe(3);

  const titles = Array.from(div.querySelectorAll('.Swimlane-title')).map(el => el.textContent);
  expect(titles).toEqual(['Backlog', 'In Progress', 'Complete']);

  ReactDOM.unmountComponentAtNode(div);
});

it('initially places all 20 cards in the Backlog swimlane with grey color', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Board />, div);

  const dragColumns = div.querySelectorAll('.Swimlane-dragColumn');
  const backlogCards = dragColumns[0].querySelectorAll('.Card');
  const inProgressCards = dragColumns[1].querySelectorAll('.Card');
  const completeCards = dragColumns[2].querySelectorAll('.Card');

  expect(backlogCards.length).toBe(20);
  expect(inProgressCards.length).toBe(0);
  expect(completeCards.length).toBe(0);

  backlogCards.forEach(card => {
    expect(card.classList.contains('Card-grey')).toBe(true);
    expect(card.getAttribute('data-status')).toBe('backlog');
  });

  ReactDOM.unmountComponentAtNode(div);
});

it('updates card status and colors correctly when moved between swimlanes', () => {
  const div = document.createElement('div');
  let boardInstance;
  ReactDOM.render(<Board ref={inst => { boardInstance = inst; }} />, div);

  const cardElement = div.querySelector('.Card');
  expect(cardElement.classList.contains('Card-grey')).toBe(true);

  // Move to inProgress
  boardInstance.updateCardStatus(cardElement, boardInstance.swimlanes.inProgress.current);
  expect(cardElement.classList.contains('Card-blue')).toBe(true);
  expect(cardElement.classList.contains('Card-grey')).toBe(false);
  expect(cardElement.getAttribute('data-status')).toBe('in-progress');

  // Move to complete
  boardInstance.updateCardStatus(cardElement, boardInstance.swimlanes.complete.current);
  expect(cardElement.classList.contains('Card-green')).toBe(true);
  expect(cardElement.classList.contains('Card-blue')).toBe(false);
  expect(cardElement.getAttribute('data-status')).toBe('complete');

  // Move back to backlog
  boardInstance.updateCardStatus(cardElement, boardInstance.swimlanes.backlog.current);
  expect(cardElement.classList.contains('Card-grey')).toBe(true);
  expect(cardElement.classList.contains('Card-green')).toBe(false);
  expect(cardElement.getAttribute('data-status')).toBe('backlog');

  ReactDOM.unmountComponentAtNode(div);
});

