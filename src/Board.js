import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

const API_BASE = 'http://localhost:3001/api/v1/clients';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clients: {
        backlog: [],
        inProgress: [],
        complete: [],
      },
      loading: true,
      error: null,
    };
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };
  }

  componentDidMount() {
    this.initDragula();
    this.fetchClients();
  }

  componentWillUnmount() {
    if (this.drake) {
      this.drake.destroy();
    }
  }

  initDragula() {
    if (this.drake) {
      this.drake.destroy();
    }
    const containers = [
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current,
    ].filter(Boolean);

    if (containers.length < 3) return;

    this.drake = Dragula(containers);

    this.drake.on('drop', (el, target, source, sibling) => {
      this.handleDrop(el, target, source, sibling);
    });
  }

  fetchClients = () => {
    return fetch(API_BASE)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(clients => {
        const backlog = clients
          .filter(client => client.status === 'backlog')
          .sort((a, b) => a.priority - b.priority);
        const inProgress = clients
          .filter(client => client.status === 'in-progress')
          .sort((a, b) => a.priority - b.priority);
        const complete = clients
          .filter(client => client.status === 'complete')
          .sort((a, b) => a.priority - b.priority);

        this.setState({
          clients: { backlog, inProgress, complete },
          loading: false,
          error: null,
        });
      })
      .catch(err => {
        console.error('Failed to fetch clients:', err);
        this.setState({
          loading: false,
          error: 'Failed to load shipping requests from backend API.',
        });
      });
  };

  updateCardStatus(el, target) {
    if (!el || !target) return;

    let newStatus = 'backlog';
    let newClass = 'Card-grey';

    if (target === this.swimlanes.inProgress.current) {
      newStatus = 'in-progress';
      newClass = 'Card-blue';
    } else if (target === this.swimlanes.complete.current) {
      newStatus = 'complete';
      newClass = 'Card-green';
    }

    el.classList.remove('Card-grey', 'Card-blue', 'Card-green');
    el.classList.add(newClass);
    el.setAttribute('data-status', newStatus);
  }

  handleDrop(el, target, source, sibling) {
    if (!el || !target) return;

    this.updateCardStatus(el, target);

    const clientId = el.getAttribute('data-id');
    if (!clientId) return;

    let targetStatus = 'backlog';
    if (target === this.swimlanes.inProgress.current) {
      targetStatus = 'in-progress';
    } else if (target === this.swimlanes.complete.current) {
      targetStatus = 'complete';
    }

    const cardsInLane = Array.from(target.querySelectorAll('.Card'));
    const cardIndex = cardsInLane.indexOf(el);
    const newPriority = cardIndex !== -1 ? cardIndex + 1 : cardsInLane.length;

    return fetch(`${API_BASE}/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: targetStatus,
        priority: newPriority,
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to update card: HTTP ${res.status}`);
        }
        return res.json();
      })
      .catch(err => {
        console.error('Error persisting card change:', err);
        this.fetchClients();
      });
  }

  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane name={name} clients={clients} dragulaRef={ref}/>
    );
  }

  render() {
    return (
      <div className="Board">
        {this.state.error && (
          <div className="alert alert-danger text-center m-3">
            <span>{this.state.error}</span>
            <button className="btn btn-sm btn-outline-danger ml-3" onClick={this.fetchClients}>
              Retry
            </button>
          </div>
        )}
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane('Backlog', this.state.clients.backlog, this.swimlanes.backlog)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('In Progress', this.state.clients.inProgress, this.swimlanes.inProgress)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('Complete', this.state.clients.complete, this.swimlanes.complete)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

