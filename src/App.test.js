import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Board from './Board';

const mockClients = [
  { id: 1, name: 'Client 1', description: 'Desc 1', status: 'in-progress', priority: 1 },
  { id: 2, name: 'Client 2', description: 'Desc 2', status: 'complete', priority: 1 },
  { id: 3, name: 'Client 3', description: 'Desc 3', status: 'backlog', priority: 1 },
  { id: 4, name: 'Client 4', description: 'Desc 4', status: 'in-progress', priority: 2 },
  { id: 6, name: 'Client 6', description: 'Desc 6', status: 'backlog', priority: 2 },
];

beforeEach(() => {
  global.fetch = jest.fn((url, options) => {
    if (!options || !options.method || options.method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockClients),
      });
    }
    if (options.method === 'PUT') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockClients),
      });
    }
    return Promise.reject(new Error('Unknown request'));
  });
});

afterEach(() => {
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

it('renders App without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('fetches clients from API on mount and renders 3 swimlanes in priority order', async () => {
  const div = document.createElement('div');
  let board;
  ReactDOM.render(<Board ref={inst => { board = inst; }} />, div);

  // Wait for fetch promise to resolve
  await board.fetchClients();

  // Force synchronous update
  const columns = div.querySelectorAll('.Swimlane-column');
  expect(columns.length).toBe(3);

  const titles = Array.from(div.querySelectorAll('.Swimlane-title')).map(el => el.textContent);
  expect(titles).toEqual(['Backlog', 'In Progress', 'Complete']);

  const backlogCards = div.querySelectorAll('.col-md-4:nth-child(1) .Card');
  const inProgressCards = div.querySelectorAll('.col-md-4:nth-child(2) .Card');
  const completeCards = div.querySelectorAll('.col-md-4:nth-child(3) .Card');

  expect(backlogCards.length).toBe(2);
  expect(inProgressCards.length).toBe(2);
  expect(completeCards.length).toBe(1);

  expect(backlogCards[0].textContent).toBe('Client 3');
  expect(backlogCards[1].textContent).toBe('Client 6');

  ReactDOM.unmountComponentAtNode(div);
});

it('sends PUT request with correct status and 1-based priority on card drop', async () => {
  const div = document.createElement('div');
  let board;
  ReactDOM.render(<Board ref={inst => { board = inst; }} />, div);
  await board.fetchClients();

  const cardElement = div.querySelector('.Card'); // Client 3
  const inProgressLane = board.swimlanes.inProgress.current;

  // Simulate dropping cardElement into inProgressLane
  inProgressLane.appendChild(cardElement);

  await board.handleDrop(cardElement, inProgressLane, board.swimlanes.backlog.current, null);

  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:3001/api/v1/clients/3',
    expect.objectContaining({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-progress', priority: inProgressLane.querySelectorAll('.Card').length }),
    })
  );

  ReactDOM.unmountComponentAtNode(div);
});

it('handles API error gracefully and displays error state', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

  const div = document.createElement('div');
  let board;
  ReactDOM.render(<Board ref={inst => { board = inst; }} />, div);

  await board.fetchClients();

  expect(div.textContent).toContain('Failed to load shipping requests from backend API.');

  ReactDOM.unmountComponentAtNode(div);
});


