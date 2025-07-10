import {
  trigger,
  transition,
  style,
  query,
  group,
  animate,
  animateChild
} from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  // 1. Slide Horizontal
  transition('mi-perfil <=> administracion', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ left: '100%' })], { optional: true }),
    group([
      query(':leave', [animate('400ms ease-out', style({ left: '-100%' }))], { optional: true }),
      query(':enter', [animate('400ms ease-out', style({ left: '0%' }))], { optional: true })
    ])
  ]),

  // 2. Fade + Scale
  transition('login <=> registro', [
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ opacity: 0, transform: 'scale(0.9)' })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-out', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))], { optional: true })
    ])
  ]),

  // 3. Slide Vertical
  transition('mi-perfil <=> solicitar-turnos', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ top: '100%' })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-out', style({ top: '-100%' }))], { optional: true }),
      query(':enter', [animate('300ms ease-out', style({ top: '0%' }))], { optional: true })
    ])
  ]),

  // 4. Fade simple
  transition('esperando-verificacion <=> login', [
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('200ms ease-out', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [animate('300ms ease-in', style({ opacity: 1 }))], { optional: true })
    ])
  ]),

  // 5. Slide izquierda con sombra
  transition('cargar-historia <=> historia-clinica', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ left: '-100%', boxShadow: '0 0 30px rgba(0,0,0,0.2)' })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-in-out', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [animate('400ms ease-in-out', style({ left: '0%' }))], { optional: true })
    ])
  ]),

  // 6. Slide vertical arriba hacia abajo (turnos-admin <=> estadisticas)
  transition('turnos-admin <=> estadisticas', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ top: '-100%' })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-in-out', style({ top: '100%' }))], { optional: true }),
      query(':enter', [animate('400ms ease-in-out', style({ top: '0%' }))], { optional: true })
    ])
  ]),

  // 7. Flip en Y (estadisticas <=> pacientes-atendidos)
  transition('mis-turnos-especialista <=> pacientes-atendidos', [
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'rotateY(90deg) scale(0.9)' })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'rotateY(-90deg) scale(0.9)' }))
      ], { optional: true }),
      query(':enter', [
        animate('400ms ease-out', style({ opacity: 1, transform: 'rotateY(0deg) scale(1)' }))
      ], { optional: true })
    ])
  ]),

  // Fallback
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        top: 0
      })
    ], { optional: true }),
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    group([
      query(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-in', style({ opacity: 1 }))
      ], { optional: true })
    ]),
    query('@*', animateChild(), { optional: true })
  ])
]);
